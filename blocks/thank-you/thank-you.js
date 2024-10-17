import APIClient, { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_SAVED_OWNER_ID,
  deleteCookie,
  SS_KEY_FORM_ENTRY_URL,
} from '../../scripts/24petwatch-utils.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';
import { getConfigValue } from '../../scripts/configs.js';

// prep for API calls
const apiBaseUrl = await getAPIBaseUrl();

const APIClientObj = new APIClient(apiBaseUrl);

// salesforce proxy
const salesforceProxyEndpoint = await getConfigValue('salesforce-proxy');

// Sequence of steps to get the owner info from the API

// Step 1 - get the paymentPortalCustomerId from the UUID (aka paymentProcessorId)
async function getPaymentCustomerIDFromUUID(paymentProcessorId) {
  try {
    const data = await APIClientObj.getPaymentCustomerIDFromUUID(paymentProcessorId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the payment customer ID:', paymentProcessorId, ' status:', status);
    return [];
  }
}

// Step 2 & Step 4 - get the owner info, which provides the owner id as well as the owner info
async function getOwner(paymentPortalCustomerId) {
  try {
    const data = await APIClientObj.getOwner(paymentPortalCustomerId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the owner:', paymentPortalCustomerId, ' status:', status);
    return [];
  }
}

// Step 3 - Update (PUT) owner sale status w/ the ownerId
async function putUpdateOwnerSaleStatus(ownerId) {
  try {
    await APIClientObj.putUpdateOwnerSaleStatus(ownerId);
  } catch (status) {
    // this is a put request, so we expect a 204 status code
    // eslint-disable-next-line no-console
    console.log('Failed to update the owner sale status:', status);
  }
}

// Step 5 - get the purchase summary
async function getPurchaseSummary(ownerId) {
  try {
    const data = await APIClientObj.getPurchaseSummary(ownerId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the purchase summary:', status);
    return [];
  }
}

// Step 6 - send the email receipt for package item, using the ownerId
async function postEmailReceipt(ownerId) {
  try {
    const data = await APIClientObj.postEmailReceipt(ownerId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to send the email receipt:', status);
    return [];
  }
}

// Step 7 - get transaction details
async function getTransaction(paymentProcessorId) {
  try {
    const data = await APIClientObj.getTransaction(paymentProcessorId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the transaction details:', status);
    return [];
  }
}

export default async function decorate() {
  // delete cookie with customer id
  deleteCookie(COOKIE_NAME_SAVED_OWNER_ID);
  // unset sessionStorage form entry URL
  sessionStorage.removeItem(SS_KEY_FORM_ENTRY_URL);

  const urlParams = new URLSearchParams(window.location.search);
  const paymentProcessorId = urlParams.get('PaymentProcessorCustomerId');
  const data = await getPaymentCustomerIDFromUUID(paymentProcessorId);
  let getOwnerDetails = await getOwner(data.paymentPortalCustomerId);

  await putUpdateOwnerSaleStatus(getOwnerDetails.id);

  // get the owner details again after the sale status has been updated
  getOwnerDetails = await getOwner(data.paymentPortalCustomerId);

  const getPurchaseSummaryDetails = await getPurchaseSummary(getOwnerDetails.id);

  await postEmailReceipt(getOwnerDetails.id);

  const transactionDetails = await getTransaction(paymentProcessorId);
  const { externalTransactionID, paymentMethod } = transactionDetails;

  const h1 = document.querySelector('h1');
  const {
    cartFlow, firstName, lastName, nonInsPromoCode,
  } = getOwnerDetails;
  const { petSummaries } = getPurchaseSummaryDetails;
  const contentColumn = document.querySelector('.thank-you-purchase .columns > div:nth-child(1) > div');

  h1.innerHTML = `Congratulations, ${firstName} ${lastName}!`;

  petSummaries.forEach((pet) => {
    const petName = pet.name;
    const petElement = document.createElement('h3');
    petElement.innerHTML = `For ${petName}`;
    contentColumn.appendChild(petElement);

    // create flex container that will hold the list of items purchased for each pet
    const ul = document.createElement('ul');
    ul.classList.add('thank-you-purchase-list');

    // build out line items for the microchip purchase
    const microchipItem = `<li><div>${petName}'s Microchip number</div><div>${pet.microChipNumber}</div></li>`;
    const membershipItem = `<li><div>${petName}'s ${pet.membershipName}</div><div>${pet.memberShipAmount}</div></li>`;

    ul.innerHTML += microchipItem;
    ul.innerHTML += membershipItem;

    contentColumn.appendChild(ul);
  });

  // build sub-total, tax, and total of items purchased
  const totals = document.createElement('ul');
  totals.classList.add('thank-you-purchase-totals');

  const { summary } = getPurchaseSummaryDetails;

  if (summary.discount > 0.0) {
    const discount = `<li><div>Discount</div><div>- $${summary.discount}</div></li>`;
    totals.innerHTML += discount;
  }

  const subTotal = `<li><div>Subtotal</div><div>$${summary.subTotal}</div></li>`;
  totals.innerHTML += subTotal;

  const taxAmount = summary.salesTaxes;
  const tax = `<li><div>Sales Tax</div><div>$${taxAmount.toFixed(2)}</div></li>`;
  totals.innerHTML += tax;

  const total = `<li><div>Total</div><div>$${summary.totalDueToday}</div></li>`;
  totals.innerHTML += total;

  contentColumn.appendChild(totals);

  const trackingData = {
    microchip_number: petSummaries[0].microChipNumber,
    product_type: petSummaries[0].membershipName,
    transaction_id: externalTransactionID,
    affiliation: '24petwatch',
    tax: summary.salesTaxes,
    payment_type: paymentMethod,
    value: summary.totalDueToday,
    shipping: petSummaries[0].nonInsurancePetSummary.shipping,
    coupon: nonInsPromoCode,
    flow: cartFlow,
    customerid: getOwnerDetails.id,
  };

  // send the GTM event
  trackGTMEvent('purchase', trackingData);

  // Salesforce Upsert
  async function setUpsertToSalesforce(email) {
    const payload = {
      payload: {
        Data: {
          OrderCompleted: true,
        },
        // EventDefinitionKey: 'APIEvent-6723a35b-b066-640c-1d7b-222f98caa9e1',
        ContactKey: email,
      },
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    await fetch(salesforceProxyEndpoint, options);
  }

  // Send data for abandoned cart journey
  try {
    await setUpsertToSalesforce(getOwnerDetails.email);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error sending the data to Salesforce', error);
  }

  const printButton = document.createElement('button');
  printButton.classList.add('button');
  printButton.innerHTML = 'Print <span class="visually-hidden">this page</span>';
  printButton.addEventListener('click', () => {
    window.print();
  });

  contentColumn.appendChild(printButton);
}
