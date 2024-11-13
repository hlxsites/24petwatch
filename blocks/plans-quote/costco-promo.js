import {
  PET_PLANS_ANNUAL_URL,
  LS_KEY_FIGO_COSTCO,
} from '../../scripts/24petwatch-utils.js';
import APIClient, { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';

export const COSTCO_FIGO_PROMO_ITEMS = {
  policyIdKey: 'poid',
  subId: 'SBSUN000016',
};

// set eligibility flag based on the following values
const eligibilityCriteria = {
  level: ['Executive'],
  type: ['Costco', 'Employee-family'],
  status: 'Active',
  policyStatus: ['Future', 'Active'],
};

const apiBaseUrl = await getAPIBaseUrl();
const APIClientObj = new APIClient(apiBaseUrl);
const costcoFigoStoredData = localStorage.getItem(LS_KEY_FIGO_COSTCO);
const costcoFigoStoredValues = costcoFigoStoredData ? JSON.parse(costcoFigoStoredData) : {};
const costcoFigosubId = COSTCO_FIGO_PROMO_ITEMS.subId;

export const getIsMultiPet = costcoFigoStoredValues.multiPet ?? true;
export const isCostcoFigo = costcoFigoStoredValues.isEligible ?? false;
export const getSavedCouponCode = costcoFigoStoredValues.couponCode ?? null;
export const getSavedPolicyId = costcoFigoStoredValues.policyId ?? null;
export const hasCostcoFigoStored = costcoFigoStoredData !== null;

// is costco figo flow
function isCostcoFigoFlow(policyId) {
  const membership = window.location.pathname.endsWith(PET_PLANS_ANNUAL_URL);
  if (membership && policyId) {
    return true;
  }
  return false;
}

// get the data
async function getCostcoPolicyData(policyId) {
  let policyData;
  const payload = {
    payload: {
      policyId,
    },
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch('https://462515-24petwatch-paul.adobeioruntime.net/api/v1/web/24petwatch-appbuilder/proxy-costco-figo-services', options);
    if (response.ok) {
      const costcoMembershipData = await response.json();
      // if we have a record associated with the policy Id
      if (costcoMembershipData.records && costcoMembershipData.records.length > 0) {
        [policyData] = costcoMembershipData.records;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error fetching policy data:', error);
  }
  return policyData;
}

// check eligibility based on eligibilityCriteria values matching record values
async function isCostcoFigoEligible(policyId) {
  let eligibilityFlag = false;
  const record = await getCostcoPolicyData(policyId);
  if (record) {
    const status = record.Status__c ?? null;
    const type = record.Type__c ?? null;
    const level = record.Level__c ?? null;
    const policyStatus = record.Insurance_Policy__r?.Status ?? null;

    if (status === eligibilityCriteria.status
      && eligibilityCriteria.level.includes(level)
      && eligibilityCriteria.type.includes(type)
      && eligibilityCriteria.policyStatus.includes(policyStatus)) {
      eligibilityFlag = true;
    }
  }
  return eligibilityFlag;
}

// checks if all promo criteria is met and requests a coupon code
// sets sessionStorage data for accessing props if needed throughout the order journey
export async function checkCostcoFigoPromo(policyId, countryCode) {
  let costcoFigoCouponData = false;
  if (policyId && countryCode) {
    if (isCostcoFigoFlow(policyId)) {
      // returns boolean
      const isEligible = await isCostcoFigoEligible(policyId);
      if (isEligible) {
        let costcoPromoData = {};
        try {
          // eslint-disable-next-line max-len
          costcoPromoData = await APIClientObj.assignNextAvailableCoupon(costcoFigosubId, policyId, countryCode);
          const allowMultiPet = costcoPromoData.allowMultiPet ?? null;
          const couponCode = costcoPromoData.couponCode ?? null;
          // eslint-disable-next-line max-len
          if (allowMultiPet !== null && couponCode !== null && couponCode !== '') {
            const storedCostcoFigoData = {
              couponCode,
              multiPet: allowMultiPet,
              policyId,
              isEligible,
            };
            // store object for next steps
            localStorage.setItem(LS_KEY_FIGO_COSTCO, JSON.stringify(storedCostcoFigoData));
            costcoFigoCouponData = storedCostcoFigoData;
          }
        } catch (status) {
          // eslint-disable-next-line no-console
          console.log('Failed to get couponCode for:', policyId, ' status:', status);
        }
      }
    }
  }
  return costcoFigoCouponData;
}
