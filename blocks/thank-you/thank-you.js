import { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';

let API_BASE_URL = '';

// get paymentProcessorId from the URL query string param, ex. https://XXX.24petwatch.com/thank-you?PaymentProcessorCustomerId={0}&flow={1}
// Example: PaymentProcessorCustomerId=0b5b3da1-9a8f-4c2a-b75a-b25e34adcbcc&flow=protectionfirst
const urlParams = new URLSearchParams(window.location.search);
const paymentProcessorId = urlParams.get('PaymentProcessorCustomerId');
let ownerId = null;

// Sequence of steps to get the owner info from the API
// Step 1 - Get the owner info from the API
async function getInfoForExistingOwner() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Owner/${paymentProcessorId}`, {
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
  // prep for API calls
  API_BASE_URL = await getAPIBaseUrl();

  // Call the function to get the owner info
  const ownerInfo = await getInfoForExistingOwner();

  // use the ownerInfo to update owner sale status
  if (ownerInfo) {
    ownerId = ownerInfo.id; // Assuming ownerInfo contains an id field
    await getUpdateOwnerSaleStatus();
  }

  // call the function to get the purchase summary
  const purchaseSummary = await getPurchaseSummary();

  // use the purchaseSummary to populate the block
  if (purchaseSummary) {
    const purchaseSummaryDiv = block.querySelector('.thank-you-purchase .columns > div > div');
    purchaseSummaryDiv.innerHTML = purchaseSummary;
  }

  // send the email receipt for package item
  if (ownerId) {
    await sendEmailReceiptForPackageItem(ownerId);
  }
}
