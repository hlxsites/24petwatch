import APIClient from '../../scripts/24petwatch-api.js';
import { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
/* import {
  getQueryParam,
} from '../../scripts/24petwatch-utils.js'; */

// prep for API calls
const apiBaseUrl = await getAPIBaseUrl();

const APIClientObj = new APIClient(apiBaseUrl);

// get paymentProcessorId from the URL query string param, ex. https://XXX.24petwatch.com/thank-you?PaymentProcessorCustomerId={0}&flow={1}
// Example: PaymentProcessorCustomerId=0b5b3da1-9a8f-4c2a-b75a-b25e34adcbcc&flow=protectionfirst
let ownerId = null;

// Sequence of steps to get the owner info from the API

// Step 1 - get the payment customer ID from the UUID
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

// Step 2 - get the owner info, which provides the ownerId
async function getOwner(paymentProcessorId) {
  try {
    const data = await APIClientObj.getOwner(paymentProcessorId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the owner:', ownerId, ' status:', status);
    return [];
  }
}

// Step 3 - Update (PUT) owner sale status
async function putUpdateOwnerSaleStatus(guidID) {
  try {
    const data = await APIClientObj.putUpdateOwnerSaleStatus(guidID);
    return data;
  } catch (status) {
    // this is a put request, so we expect a 204 status code
    // eslint-disable-next-line no-console
    console.log('Failed to update the owner sale status:', status);
  }
  return null; // Add a return statement at the end of the function
}

// Step 4 - get the purchase summary
async function getPurchaseSummary(paymentProcessorId) {
  try {
    const data = await APIClientObj.getPurchaseSummary(paymentProcessorId);
    return data;
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the purchase summary:', status);
    return [];
  }
}

// Step 5 - send the email receipt for package item, using the ownerId
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

export default async function decorate(block) {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentProcessorId = urlParams.get('PaymentProcessorCustomerId');

  console.log('PaymentProcessorCustomerId:', paymentProcessorId);

  const data = await getPaymentCustomerIDFromUUID(paymentProcessorId);

  console.log('Owner data:', data);

  const getOwnerDetails = await getOwner(data.paymentPortalCustomerId);
  console.log(getOwnerDetails);

  await putUpdateOwnerSaleStatus(getOwnerDetails.id);

  const getPurchaseSummaryDetails = await getPurchaseSummary(getOwnerDetails.id);
  console.log(getPurchaseSummaryDetails);

  await postEmailReceipt(getOwnerDetails.id);

  const h1 = document.querySelector('h1');
  const { firstName, lastName } = getOwnerDetails;
  const { petSummaries } = getPurchaseSummaryDetails;

  h1.innerHTML = `Congratulations, ${firstName} ${lastName}!`;

  petSummaries.forEach((pet, index) => {
    const petName = pet.name;
    const petElement = document.querySelector(`.thank-you-purchase .columns > div:nth-child(${index + 1}) > div h3`);
    petElement.innerHTML = `For ${petName}`;
  });
}
