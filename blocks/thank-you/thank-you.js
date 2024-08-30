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
// Step 1 - Get the owner info from the API
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

// Step 2 - Update owner sale status
async function getUpdateOwnerSaleStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Owner/UpdateOwnerSaleStatus`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
  return null;
}

// Step 3 - get the purchase summary
async function getPurchaseSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Utility/GetPurchaseSummary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
  return null;
}

// Step 4 - send the email receipt for package item, using the ownerId
async function sendEmailReceiptForPackageItem(ownerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Transaction/SendEmailReceiptForPackageItem/${ownerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
  return null;
}

export default async function decorate(block) {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentProcessorId = urlParams.get('PaymentProcessorCustomerId');

  console.log('PaymentProcessorCustomerId:', paymentProcessorId);

  let data = await getOwner(paymentProcessorId);

  console.log('Owner data:', data);
}
