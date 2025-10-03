import {
  PET_PLANS_ANNUAL_URL,
  LS_KEY_COSTCO_FIGO,
} from '../../scripts/24petwatch-utils.js';
import APIClient, { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
import { getConfigValue } from '../../scripts/configs.js';

export const COSTCO_FIGO_PROMO_ITEMS = {
  policyIdKey: 'poid',
  subId: 'COSTCOFIGO',
};

// set eligibility flag based on the following values
const eligibilityCriteria = {
  level: ['Executive'],
  status: 'Active',
  policyStatus: ['Future', 'Active'],
};

const apiBaseUrl = await getAPIBaseUrl();
const APIClientObj = new APIClient(apiBaseUrl);
const costcoFigoService = await getConfigValue('costco-figo-proxy');
const costcoFigoStoredData = localStorage.getItem(LS_KEY_COSTCO_FIGO);
const costcoFigoStoredValues = costcoFigoStoredData ? JSON.parse(costcoFigoStoredData) : {};
const costcoFigosubId = COSTCO_FIGO_PROMO_ITEMS.subId;
const hasCostcoFigoStored = costcoFigoStoredData !== null;

export const getIsMultiPet = costcoFigoStoredValues.multiPet ?? true;
export const isCostcoFigo = costcoFigoStoredValues.isEligible ?? false;
export const getSavedCouponCode = costcoFigoStoredValues.couponCode ?? null;
export const getSavedPolicyId = costcoFigoStoredValues.policyId ?? null;

// is costco figo flow
function isCostcoFigoFlow() {
  return window.location.pathname.endsWith(PET_PLANS_ANNUAL_URL);
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
    const response = await fetch(costcoFigoService, options);
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
    const level = record.Level__c ?? null;
    const policyStatus = record.Insurance_Policy__r?.Status ?? null;

    if (status === eligibilityCriteria.status
      && eligibilityCriteria.level.includes(level)
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
    if (isCostcoFigoFlow()) {
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
            localStorage.setItem(LS_KEY_COSTCO_FIGO, JSON.stringify(storedCostcoFigoData));
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

// remove storage data
export async function resetCostcoFigoData() {
  if (hasCostcoFigoStored) {
    localStorage.removeItem(LS_KEY_COSTCO_FIGO);
  }
}
