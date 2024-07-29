import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import {
  API_BASE_URL,
  STEP_1_URL,
  ALLOW_ZERO_PAYMENT,
  POSTAL_CODE_CANADA_REGEX,
  EMAIL_REGEX,
  COOKIE_NAME,
  getCombinedCookie,
  deleteCookie,
  asDecimal,
} from './tag-utils.js';

let petIdValue = ''; // value from the cookie set in Step 1 and used in Step 2
let ownerIdValue = ''; // (ditto)

function showPersonalErrorMessage(errorMessage) {
  const errorElement = document.querySelector('.error-message.personal-error-message');
  errorElement.textContent = errorMessage;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

function buildOwnerPayload(emailValue, zipCodeValue) {
  return {
    payload: {
      email: emailValue,
      zipCode: zipCodeValue,
      partnerID: 84, // hardcoded
      cartFlow: 3, // hardcoded
      referralURL: '',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      homePhone: '',
      remoteHost: '',
    },
  };
}

async function executeUpdatePersonalInformation(emailValue, zipCodeValue) {
  const apiErrorMsg = 'An error occurred while updating your personal information. Please try again later.';
  try {
    const response = await fetch(`${API_BASE_URL}/Owner/${ownerIdValue}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOwnerPayload(emailValue, zipCodeValue)),
    });
    if (!response.ok) {
      showPersonalErrorMessage(apiErrorMsg);
      return;
    }
    // reset the button after a successful update
    showPersonalErrorMessage('Updated personal information successfully.'); // show success message
    const updatePersonalInformation = document.querySelector('#updatePersonalInformation');
    updatePersonalInformation.disabled = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error attempting to update personal information:', error);
    showPersonalErrorMessage(apiErrorMsg);
  }
}

async function getOwnerInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/Owner/${ownerIdValue}`);
    if (!response.ok) {
      throw new Error('Network response was not ok'); // caught below
    }
    const data = await response.json();
    const { email } = data;
    const { zipCode } = data;
    return { email, zipCode };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch owner information:', error);
    return null;
  }
}

function removePet() {
  const endPoint = `Pet?petId=${petIdValue}`;
  try {
    // ignore waiting for the response since we are deleting the pet
    fetch(`${API_BASE_URL}/${endPoint}`, {
      method: 'DELETE',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error attempting to remove the pet:', error);
  }
  deleteCookie(COOKIE_NAME); // remove the cookie
  window.location.href = `.${STEP_1_URL}`; // redirect to the starting page
}

function refreshListOfPetTags(petTags) {
  // if there are no pet tags, then show an error message
  const errorMessage = 'Please repeat <a href="./tag-select">Step 2</a> to choose tags for your pet.';

  // dynamically create the list of pet tags, and pre-select the quantity for each tag
  const petTagInfoContainer = document.querySelector('#pet-tag-info-container');
  let petTagInfo;
  if (petTags.length > 0) {
    petTagInfo = petTags.map((petTag, index) => {
      // build the 'select' element, and pre-chose the quantity
      let selectHTML = `<select id="quantity-tag-${index}" name="quantity-tag-${index}">`;
      for (let i = 1; i <= 10; i += 1) {
        // example: <option value="1" selected>1</option>
        selectHTML += `<option value="${i}"${i === petTag.quantity ? ' selected' : ''}>${i}</option>`;
      }
      selectHTML += '</select>';
      // return the HTML for this pet tag
      return `
      <div class="pet-tag-info">
        <p class="tag-name">${petTag.name}</p>
        <label for="quantity-tag-${index}">Quantity:</label>
        ${selectHTML}
        <br><a id="remove-tag-${index}" class="remove" href="#">remove</a>
      </div>
    `;
    });
    petTagInfo = petTagInfo.join('');
  } else {
    petTagInfo = errorMessage;
  }
  petTagInfoContainer.innerHTML = petTagInfo;

  // listen for a change of quantity
  const quantitySelects = document.querySelectorAll('[id^="quantity-tag-"]');
  quantitySelects.forEach((select) => {
    select.addEventListener('change', (event) => {
      const index = parseInt(event.target.id.split('-')[2], 10); // id like 'quantity-tag-0'
      const quantity = parseInt(event.target.value, 10);
      // eslint-disable-next-line no-use-before-define
      updateQuantityForTag(index, quantity);
    });
  });

  // listen for the removal of a tag
  const removeTags = document.querySelectorAll('[id^="remove-tag-"]');
  removeTags.forEach((select) => {
    select.addEventListener('click', (event) => {
      const index = parseInt(event.target.id.split('-')[2], 10); // id like 'remove-tag-0'
      // eslint-disable-next-line no-use-before-define
      removeTag(index);
    });
  });
}

function isValidIndex(index, array) {
  return Number.isInteger(index) && index >= 0 && index < array.length;
}

const helper = {
  /** Format a number as currency.  Example: 123 is returned as $123.00 */
  formatCurrency(value) {
    return `$${value.toFixed(2)}`;
  },
};

// ----- START: shopping cart -----
/** structure of the shopping cart */
const shoppingCart = {
  petName: '(unknown pet)',
  lineItems: [], // array of {productId, name, quantity, priceEach, priceTotal}
  subtotal: 0.00, // total amount of all items: sum of (price * quantity)
  salesTax: 0.00, // total amount of sales tax: (subtotal * taxRate)
  shippingFee: 0.00, // total amount of shipping fees
  total: 0.00, // total amount: sum of (subtotal + salesTax + shippingFee)
};

function showGeneralErrorMessage(errorMessage) {
  const errorElement = document.querySelector('.error-message.general-error-message');
  errorElement.innerHTML = errorMessage;
  errorElement.style.display = 'block';
}

async function recomputeShoppingCart() {
  const apiErrorMsg = 'Failed to recompute the shopping cart. Please try again later.';
  const endPoint = `Product/NonInsurance/GetTotalFeeForOwner?ownerId=${ownerIdValue}`;
  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}`);
    if (response.ok) {
      const data = await response.json();
      shoppingCart.subtotal = asDecimal(data.totalSalesPrice);
      shoppingCart.salesTax = asDecimal(data.totalTaxAmount);
      shoppingCart.shippingFee = asDecimal(data.totalShippingCharge);
      shoppingCart.total = asDecimal(data.totalNonInsuranceAmountDueToday);
      return;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error when recomputing the shopping cart:', error);
  }
  // reset all values to unknown
  const unknownNumber = '(unknown)';
  shoppingCart.subtotal = unknownNumber;
  shoppingCart.salesTax = unknownNumber;
  shoppingCart.shippingFee = unknownNumber;
  shoppingCart.total = unknownNumber;
  showGeneralErrorMessage(apiErrorMsg);
}

function displayShoppingCart() {
  const shoppingCartContainer = document.querySelector('#shopping-cart-container');
  let lineItemDetails = shoppingCart.lineItems.map((item) => ` 
    <div class="grid-wrapper-x2">
      <div class="grid-item">${item.name}</div>
      <div class="grid-item">${helper.formatCurrency(item.priceTotal)}</div>
      <div class="grid-item"></div> <!-- empty cell -->
      <div class="grid-item small-font">QUANTITY: ${item.quantity}</div>
    </div>
  `);
  lineItemDetails = lineItemDetails.join('');

  shoppingCartContainer.innerHTML = jsx`
    <div class="wrapper headings-left">
      <h5>${shoppingCart.petName}</h5>
      ${lineItemDetails}
      <div class="shopping-cart-summary">
        <div class="grid-wrapper-x2">
          <div class="grid-item"><h6>Pet Tags</h6></div>
          <div class="grid-item"></div> <!-- empty cell -->
        </div>
        <div class="grid-wrapper-x2">
          <div class="grid-item">Subtotal:</div>
          <div class="grid-item">${helper.formatCurrency(shoppingCart.subtotal)}</div>
        </div>
        <div class="grid-wrapper-x2">
          <div class="grid-item">Shipping:</div>
          <div class="grid-item">${helper.formatCurrency(shoppingCart.shippingFee)}</div>
        </div>
        <div class="grid-wrapper-x2">
          <div class="grid-item">Sales Tax:</div>
          <div class="grid-item">${helper.formatCurrency(shoppingCart.salesTax)}</div>
        </div>
        <div class="grid-wrapper-x2">
          <div class="grid-item"><strong>Total:</strong></div>
          <div class="grid-item"><strong>${helper.formatCurrency(shoppingCart.total)}</strong></div>
        </div>
        <div class="grid-wrapper-x2 highlight-payment">
          <div class="grid-item"><strong>Due Today:</strong></div>
          <div class="grid-item"><strong>${helper.formatCurrency(shoppingCart.total)}</strong></div>
        </div>
      </div>
    </div>
  `;

  const haveLineItems = shoppingCart.lineItems.length > 0;
  const continueButton = document.querySelector('#continue');
  continueButton.disabled = !(haveLineItems && (ALLOW_ZERO_PAYMENT || shoppingCart.total > 0));
}

async function updateItemInBackendCart(name, quantity, productId) {
  const apiErrorMsg = 'Failed to update the shopping cart. Please try again later.';
  const endPoint = 'Product/NonInsurance/SaveSelected';
  const queryParams = `petId=${petIdValue}&quoteRecId=${productId}&quantity=${quantity}&autoRenew=false`;
  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}', // empty body: payload is sent in the query string?!
    });
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error when updating the shopping cart item to the backend:', error);
    showGeneralErrorMessage(apiErrorMsg);
  }
}

async function updateQuantityForTag(itemIndex, newQuantity, refresh = true) {
  if (isValidIndex(itemIndex, shoppingCart.lineItems)) {
    // eslint-disable-next-line max-len
    await updateItemInBackendCart(shoppingCart.lineItems[itemIndex].name, newQuantity, shoppingCart.lineItems[itemIndex].productId);
    shoppingCart.lineItems[itemIndex].quantity = newQuantity;
    // eslint-disable-next-line max-len
    shoppingCart.lineItems[itemIndex].priceTotal = asDecimal(newQuantity * shoppingCart.lineItems[itemIndex].priceEach);
  }
  if (refresh) {
    await recomputeShoppingCart();
    displayShoppingCart();
  }
}

async function removeTag(itemIndex) {
  if (isValidIndex(itemIndex, shoppingCart.lineItems)) {
    await updateQuantityForTag(itemIndex, 0, false);
    shoppingCart.lineItems.splice(itemIndex, 1);
    refreshListOfPetTags(shoppingCart.lineItems);
    await recomputeShoppingCart();
    displayShoppingCart();
  }
}

async function addItemToCart(productId, name, quantity, priceEach, refresh = true) {
  // note: at this step we do ~not~ add any new items to the backend

  const priceTotal = asDecimal(quantity * priceEach);
  // eslint-disable-next-line object-curly-newline
  const newItem = { productId, name, quantity, priceEach, priceTotal };

  // Find the index of the line item with the same productId
  // eslint-disable-next-line max-len
  const existingItemIndex = shoppingCart.lineItems.findIndex((item) => item.productId === productId);
  if (existingItemIndex !== -1) {
    shoppingCart.lineItems[existingItemIndex] = newItem; // replace the existing item
  } else {
    shoppingCart.lineItems.push(newItem); // add the new item
  }

  // refresh
  if (refresh) {
    await recomputeShoppingCart();
    displayShoppingCart();
  }
}
// ----- END: shopping cart -----

function removeAnyErrorMessage(element, setCheckmark = true) {
  const container = element.parentElement;
  const errorMessage = container.querySelector('.error-message');
  const checkmark = container.querySelector('.checkmark');

  errorMessage.textContent = '';
  container.classList.remove('error');

  if (setCheckmark) {
    checkmark.setAttribute('style', 'opacity: 1;'); // show
  } else {
    checkmark.setAttribute('style', 'opacity: 0;'); // hide
  }
}

function showErrorMessage(element, errMsg) {
  const container = element.parentElement;
  const errorMessage = container.querySelector('.error-message');
  const checkmark = container.querySelector('.checkmark');

  errorMessage.textContent = errMsg;
  container.classList.add('error');
  checkmark.setAttribute('style', 'opacity: 0;');
}

function checkFieldsValidity() {
  const email = document.querySelector('#email.valid');
  const zipCode = document.querySelector('#zipCode.valid');
  const updatePersonalInformation = document.querySelector('#updatePersonalInformation');
  updatePersonalInformation.disabled = !(email && zipCode);
}

function validateField(element, regex, message = 'A valid input is required') {
  let valid = true;
  const trimmedValue = element.value.trim();
  if (trimmedValue !== '') {
    if (!regex.test(trimmedValue)) {
      valid = false;
    }
  } else {
    valid = false; // default, since we have no value to test
  }
  // react to the validation
  let returnValue;
  if (!valid) {
    element.classList.remove('valid');
    showErrorMessage(element, message);
    returnValue = null;
  } else {
    element.classList.add('valid');
    removeAnyErrorMessage(element, true);
    returnValue = trimmedValue;
  }
  checkFieldsValidity(); // enable/disable the 'Update personal information' button
  return returnValue;
}

async function validatePostalCode(element, regex, message) {
  // 1st: validate using the RegEx
  let valid = true;
  const trimmedValue = element.value.trim();
  if (trimmedValue !== '') {
    if (!regex.test(trimmedValue)) {
      valid = false;
    }
  } else {
    valid = false; // default, since we have no value to test
  }
  if (!valid) {
    element.classList.remove('valid');
    checkFieldsValidity();
    showErrorMessage(element, message);
    return null;
  }

  // 2nd: validate using the API
  const strippedValue = trimmedValue.replace(/ /g, ''); // remove all spaces
  const countryId = (isCanada) ? 1 : 2; // 1 = Canada, 2 = USA
  const endPoint = `Utility/GetCountryState/${strippedValue}`;
  const apiErrorMsg = 'Cannot validate the postal code.  Please try again later.';
  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}`);
    if (response.status === 404) {
      element.classList.remove('valid');
      checkFieldsValidity();
      showErrorMessage(element, message);
      return null; // postal code not found
    }
    if (!response.ok) {
      showPersonalErrorMessage(apiErrorMsg);
      return null;
    }
    const data = await response.json();
    if (data.countryId === countryId) {
      element.classList.add('valid');
      checkFieldsValidity();
      removeAnyErrorMessage(element, true);
      return trimmedValue;
    }
    element.classList.remove('valid');
    checkFieldsValidity();
    showErrorMessage(element, message); // postal code is not in the correct country
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error with validating the postal code:', error);
    showPersonalErrorMessage(apiErrorMsg);
    return null;
  }
}

async function updateShoppingCartFromBackend() {
  const apiErrorMsg = 'Failed to retrieve the shopping cart. Please try refreshing.';
  const endPoint = `Product/NonInsurance/GetSelectedForOwner/${ownerIdValue}`;
  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}`);
    if (response.ok) {
      const data = await response.json();
      data.forEach((item) => {
        addItemToCart(item.quoteRecId, item.itemName, item.quantity, item.salesPrice, false);
      });
      if (data.length > 0) {
        refreshListOfPetTags(shoppingCart.lineItems); // re-index the tags
        await recomputeShoppingCart();
        displayShoppingCart();
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error when retrieving the shopping cart from the backend:', error);
    showGeneralErrorMessage(apiErrorMsg);
  }
}

async function proceedToPayment() {
  // sanity checks
  if (shoppingCart.lineItems.length === 0) {
    showGeneralErrorMessage('Please select at least one pet tag before proceeding to payment.');
    return;
  }
  if (shoppingCart.total <= 0 && !ALLOW_ZERO_PAYMENT) {
    showGeneralErrorMessage('Please select at least one pet tag before proceeding to payment.');
    return;
  }
  // prepare payment transaction
  const apiErrorMsg = 'Failed to create the payment transaction. Please try again later.';
  const endPoint = 'Transaction/PostSalesForPayment';
  const queryParams = `flow=3&ownerId=${ownerIdValue}&redirectURL=`; // no redirect URL
  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}', // empty body: payload is sent in the query string?!
    });
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
    }
    const data = await response.json();
    const userId = ownerIdValue;
    const customerId = data.paymentProcessingUserId;
    let paymentURL = data.paymentProcessorRedirectBackURL;
    const index = paymentURL.indexOf('?');
    if (index !== -1) {
      paymentURL = paymentURL.substring(0, index); // remove any query string
    }
    window.location.href = `${paymentURL}?flow=tagsfirst&userId=${userId}&customerId=${customerId}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error when creating the payment transaction:', error);
    showGeneralErrorMessage(apiErrorMsg);
  }
}

export default async function decorateStep3(block) {
  // add in the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/pet-tag-quote/summary-quote.css';
  document.head.appendChild(link);

  // create the HTML
  // get values from the previous steps
  let petName = '';
  [petName = '', petIdValue = '', ownerIdValue = ''] = getCombinedCookie(COOKIE_NAME, []);
  if (!petName || !petIdValue || !ownerIdValue) {
    removePet();
    return;
  }
  shoppingCart.petName = petName;

  block.innerHTML = jsx`
    <div class="summary headings-left">
      <div class="sec1">
        <div class="pet-info">
          <h3>${petName}</h3>
          <a id="remove-pet" class="remove" href="#">remove</a>
        </div>
        <div class="error-message general-error-message content-center"></div>
        <dialog id="remove-pet-dialog">
          <h3>Remove Confirmation</h3>
          <p>
             Are you sure you want to remove this pet from your order?
            <br>All associated products will be removed.
          </p>
          <div class="dialog-buttons-container">
            <button type="button" class="yes" id="confirm-remove-pet">Yes</button>
            <button type="button" class="no" id="cancel-remove-pet" autofocus>No</button>
          </div>
        </dialog>
        <h4>Pet Tags</h4>
        <form class="border-none">
          <div id="pet-tag-info-container"></div>
        </form>
      </div>
      <div class="sec2">
        <h4>Change personal information</h4>
        <form id="personalInformationForm">
          <div class="wrapper">
            <input type="email" id="email" name="email" placeholder="" maxlength="320" required>
            <label for="email" class="float-label">Email Address*</label>
            <span class="checkmark"></span>
            <div class="error-message"></div>
          </div>
          <div class="wrapper">
            <input type="text" id="zipCode" name="zipCode" placeholder="" maxlength="7" required>
            <label for="zipCode" class="float-label">Postal Code*</label>
            <span class="checkmark"></span>
            <div class="error-message"></div>
          </div>
          <div class="content-center">
            <button type="button" id="updatePersonalInformation">Update personal information</button>
          </div>
          <div class="error-message personal-error-message content-center"></div>
        </form>
      </div>
      <div class="sec3 content-center">
        <p><strong>This amount will appear as PTZ*24PTWTCH* on your credit card or bank statement.</strong></p>
        <button type="submit" id="continue">Proceed to Payment</button>
      </div>
      <div class="sec4">
        <div id="shopping-cart-container"></div>
      </div>
    </div>
  `;

  // refresh the shopping cart from the backend
  await updateShoppingCartFromBackend();

  // owner's personal info: field validations
  const email = document.querySelector('#email');
  email.addEventListener('input', (event) => {
    validateField(event.target, EMAIL_REGEX, 'A valid email is required');
  });
  const zipCode = document.querySelector('#zipCode');
  zipCode.addEventListener('input', (event) => {
    validatePostalCode(event.target, POSTAL_CODE_CANADA_REGEX, 'Please enter a valid postal code');
  });
  // owner's personal info: initialize details
  let myEmailName = '(please supply again)';
  let myZipCode = '(unknown)';
  getOwnerInfo().then((ownerInfo) => {
    if (ownerInfo) {
      myEmailName = ownerInfo.email;
      myZipCode = ownerInfo.zipCode;
    }
    email.value = myEmailName;
    zipCode.value = myZipCode;
    const triggerEvent = new Event('input');
    email.dispatchEvent(triggerEvent);
    zipCode.dispatchEvent(triggerEvent);
    checkFieldsValidity(); // set initial state
  });
  // owner's personal info: handle button to update their personal information
  const updatePersonalInformation = document.querySelector('#updatePersonalInformation');
  updatePersonalInformation.addEventListener('click', async (event) => {
    event.preventDefault();
    const emailValue = validateField(email, EMAIL_REGEX, 'A valid email is required');
    const zipCodeValue = validateField(zipCode, POSTAL_CODE_CANADA_REGEX, 'Please enter a valid postal code');
    if (emailValue && zipCodeValue) {
      await executeUpdatePersonalInformation(emailValue, zipCodeValue);
    }
  });

  // listen for removal of the pet
  const removePetAction = document.querySelector('#remove-pet');
  const removePetDialog = document.querySelector('#remove-pet-dialog');
  removePetAction.addEventListener('click', () => {
    removePetDialog.showModal();
  });
  const cancelRemovePet = document.querySelector('#cancel-remove-pet');
  cancelRemovePet.addEventListener('click', () => {
    removePetDialog.close();
  });
  const confirmRemovePet = document.querySelector('#confirm-remove-pet');
  confirmRemovePet.addEventListener('click', () => {
    removePetDialog.close();
    removePet();
  });

  // button: proceed to payment
  const proceedToPaymentButton = document.querySelector('#continue');
  proceedToPaymentButton.addEventListener('click', async (event) => {
    event.preventDefault();
    await proceedToPayment();
  });
}
