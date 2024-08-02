import { jsx } from '../../scripts/scripts.js';
import { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_FOR_PET_TAGS as COOKIE_NAME,
  getCombinedCookie,
} from '../../scripts/24petwatch-utils.js';
import {
  STEP_1_URL,
  STEP_3_URL,
  ALLOW_ZERO_PAYMENT,
  PRICE_PER_TAG_METAL,
  PRICE_PER_TAG_LIFETIME_SMALL,
  PRICE_PER_TAG_LIFETIME_LARGE,
  asDecimal,
} from './tag-utils.js';

const pricePerTagMetal = PRICE_PER_TAG_METAL; // ex: 11.95
const pricePerTagLifetimeSmall = PRICE_PER_TAG_LIFETIME_SMALL; // ex: 17.95
const pricePerTagLifetimeLarge = PRICE_PER_TAG_LIFETIME_LARGE; // ex: 19.95

const imagePath = '/images/tags/';

let petIdValue = ''; // value from the cookie set in Step 1
let ownerIdValue = ''; // (ditto)
// eslint-disable-next-line max-len
let productIds = []; // array of products like: [ { name: 'Red Bone Metal Tag', recId: 9164476 }, ...]
let API_BASE_URL = '';

// ----- START: shopping cart -----
const helper = {
  /** Format a number as currency.  Example: 123 is returned as $123.00 */
  formatCurrency(value) {
    return `$${value.toFixed(2)}`;
  },
};

/** structure of the shopping cart */
const shoppingCart = {
  petName: '(unknown pet)',
  lineItems: [], // array of {productId, name, quantity, priceEach, priceTotal}
  subtotal: 0.00, // total amount of all items: sum of (price * quantity)
  salesTax: 0.00, // total amount of sales tax: (subtotal * taxRate)
  shippingFee: 0.00, // total amount of shipping fees
  total: 0.00, // total amount: sum of (subtotal + salesTax + shippingFee)
};

function showGeneralErrorMessage(errorMessage = '') {
  if (!errorMessage) {
    // eslint-disable-next-line no-param-reassign
    errorMessage = `Please repeat <a href=".${STEP_1_URL}">Step 1</a> to identify your pet.`;
  }
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

async function getProductIdFromName(name, notFoundId = 0) {
  // example:
  //   productIds = [
  //     { name: 'Red Bone Metal Tag',       recId: 9164476 },
  //     { name: 'Charcoal Heart Metal Tag', recId: 1234567 },
  //     { name: 'Traditional Bone – Sm',    recId: 2870235 },
  //     { name: 'Pet Paws Circle – Lg',     recId: 9876543 },
  //     ...
  //   ];
  // returns: the recId for the given name, or notFoundId if not found
  if (productIds.length === 0) {
    // fetch productIds from the API
    const apiErrorMsg = `Failed to retrieve details for tag ${name}. Please try again later.`;
    const endPoint = `Product/NonInsurance/GetAvailable/${petIdValue}`;
    try {
      const response = await fetch(`${API_BASE_URL}/${endPoint}`);
      if (response.ok) {
        const data = await response.json();
        const isTagProduct = (item) => item.itemGroupId.includes('Tags');
        productIds = data.reduce((acc, item) => {
          if (isTagProduct(item)) {
            acc.push({ name: item.itemName, recId: item.recId });
          }
          return acc;
        }, []);
      } else {
        showGeneralErrorMessage(apiErrorMsg);
        return notFoundId;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('There was an error when retrieving all tags for the pet:', error);
      showGeneralErrorMessage(apiErrorMsg);
      return notFoundId;
    }
  }
  // find the product id for the given name
  let returnValue = notFoundId;
  const matchingProduct = productIds.find((product) => product.name === name);
  if (matchingProduct) {
    // Ensure productId is resolved in case it is a promise
    returnValue = await matchingProduct.recId;
  }
  return returnValue; // might be the value for notFoundId
}

async function updateItemInBackendCart(name, quantity) {
  const apiErrorMsg = 'Failed to update the shopping cart. Please try again later.';
  const productId = await getProductIdFromName(name);
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

async function addItemToCart(productId, name, quantity, priceEach, refresh = true) {
  if (refresh) {
    await updateItemInBackendCart(name, quantity);
  }

  const priceTotal = asDecimal(quantity * priceEach);
  // eslint-disable-next-line object-curly-newline
  const newItem = { productId, name, quantity, priceEach, priceTotal };

  // If the item is already in the cart, replace it; otherwise, add it.
  // eslint-disable-next-line max-len
  const existingItemIndex = shoppingCart.lineItems.findIndex((item) => item.name === name);
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

function uppercaseFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function updateTagImage() {
  const tagType = document.querySelector('input[name="tagType"]:checked').value;
  if (tagType === 'metal') {
    const imageTagTypeMetal = document.querySelector('#imageTagTypeMetal');
    const color = document.querySelector('input[name="colors"]:checked').value; // {red, teal, charcoal}
    const shape = document.querySelector('input[name="shapes"]:checked').value; // {bone, heart}
    imageTagTypeMetal.src = `${imagePath}${color}-${shape}.png`;
    imageTagTypeMetal.alt = `${color} ${shape} metal tag`;
  } else {
    const imageTagTypeLifetime = document.querySelector('#imageTagTypeLifetime');
    const shapeAndKind = document.querySelector('input[name="lifetime-tag"]:checked').value; // {traditional-bone, traditional-circle, paws-bone, paws-circle}
    const [kind, shape] = shapeAndKind.split('-');
    imageTagTypeLifetime.src = `${imagePath}${kind}-${shape}.png`;
    imageTagTypeLifetime.alt = `${kind} ${shape} lifetime tag`;
  }
}

function executeSubmit() {
  // eslint-disable-next-line max-len
  // note: because we kept the shopping cart current with the backend, we simply move on to the next step
  window.location.href = `.${STEP_3_URL}`; // ex: '/summary-quote'
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

export default async function decorateStep2(block) {
  // add in the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/pet-tag-quote/tag-select.css';
  document.head.appendChild(link);

  // prep for API calls
  API_BASE_URL = await getAPIBaseUrl();

  // create the HTML
  // initialize form based on results from Step 1
  let petName;
  [petName = '', petIdValue = '', ownerIdValue = ''] = getCombinedCookie(COOKIE_NAME, []);

  let callShowGeneralErrorMessage = false;
  let disableActionButtons = '';
  if (!petName || !petIdValue || !ownerIdValue) {
    petName = '(unknown pet)';
    callShowGeneralErrorMessage = true;
    disableActionButtons = 'disabled';
  }
  shoppingCart.petName = petName;

  block.innerHTML = jsx`
    <form id="tag-select-form">
      <h3>Tags for your pet</h3>
      <p class="wrapper content-center">Have your pet's microchip number engraved on a durable tag to ensure he or she can always be identified.</p>
      <hr/>
      <div class="wrapper wide-padding">
        <div class="error-message general-error-message content-center"></div>
        <label for="petNameSelect">Select your pet:</label>
        <select id="petNameSelect" name="petNameSelect">
          <option value="${petName}">${petName}</option>
        </select>
      </div>
      <div class="wrapper flex-wrapper">
        <div class="radio-wrapper">
          <input type="radio" id="tagTypeMetal" name="tagType" value="metal" checked>
          <label for="tagTypeMetal">Standard Metal Tags</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="tagTypeLifetime" name="tagType" value="lifetime">
          <label for="tagTypeLifetime">Lifetime Warranty Tags</label>
        </div>
      </div>
      <!-- metal tags -->
      <div class="wrapper flex-wrapper metal">
        <div class="wrapper column-half">
          <div class="content-center">
            <img id="imageTagTypeMetal" src="${imagePath}red-heart.png" alt="red heart metal tag" class="large">
          </div>
          <p>Available in 3 different colors:</p>
          <div class="grid-wrapper-x4">
            <div class="grid-item radio-wrapper">
              <input type="radio" id="red" name="colors" value="red" checked>
              <label for="red" class="color-disc">
                <img src="${imagePath}red.png" alt="red color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
            <div class="grid-item radio-wrapper">  
              <input type="radio" id="teal" name="colors" value="teal">
              <label for="teal" class="color-disc">
                <img src="${imagePath}teal.png" alt="teal color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
            <div class="grid-item radio-wrapper">
              <input type="radio" id="charcoal" name="colors" value="charcoal">
              <label for="charcoal" class="color-disc">
                <img src="${imagePath}charcoal.png" alt="charcoal color" class="outline color-disc" width="20" height="20">
              </label>
            </div>
          </div>
          <p>Available in 2 shapes:</p>
          <div class="grid-wrapper-x4">
            <div class="grid-item radio-wrapper">
              <input type="radio" id="bone" name="shapes" value="bone">
              <label for="bone">
                <img src="${imagePath}bone.png" alt="bone shape" class="outline shape" width="20" height="20">
              </label>
            </div>
            <div class="grid-item radio-wrapper">  
              <input type="radio" id="heart" name="shapes" value="heart" checked>
              <label for="heart">
                <img src="${imagePath}heart.png" alt="heart shape" class="outline shape" width="20" height="20">
              </label>
            </div>
          </div>
        </div>
        <div class="wrapper column-half">
          <p class="content-center">Details:</p>
          <ul>
            <li>Long lasting and durable</li>
            <li>Available in 2 shapes: bone, heart</li>
            <li>Includes your pet's name and unique microchip number</li>
            <li>Highly visible design</li>
          </ul>
          <hr>
          <p><span id="pricePerTagM">$${pricePerTagMetal}</span> &nbsp; + &nbsp; Shipping</p>
          <br>
          <label for="quantitySelectM">Quantity:</label>
          <select id="quantitySelectM" name="quantitySelectM">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
          <div class="wrapper wrapper-text-center">
            <button type="button" id="addToCartM" ${disableActionButtons}>Add to Cart</button>
          </div>
          <p class="content-center">Order by phone: <a href="tel:18665972424">1-866-597-2424</a></p>
        </div>
      </div>
      <!-- lifetime tags -->
      <div class="wrapper flex-wrapper lifetime">
        <div class="wrapper column-half">
          <div class="content-center">
            <img id="imageTagTypeLifetime" src="${imagePath}paws-bone.png" alt="paws bone lifetime tag" class="large">
          </div>
          <div class="grid-wrapper-x4">
            <p class="grid-item two-cells">Traditional:</p>
            <p class="grid-item two-cells">Paw Print:</p>
            <div class="grid-item radio-wrapper">
                <input type="radio" id="traditional-bone" name="lifetime-tag" value="traditional-bone">
                <label for="traditional-bone">
                  <img src="${imagePath}bone.png" alt="traditional bone" class="outline shape" width="20" height="20">
                </label>
            </div>
            <div class="grid-item radio-wrapper">  
                <input type="radio" id="traditional-circle" name="lifetime-tag" value="traditional-circle">
                <label for="traditional-circle">
                  <img src="${imagePath}circle.png" alt="traditional circle" class="outline shape" width="20" height="20">
                </label>
            </div>
            <div class="grid-item radio-wrapper">
                <input type="radio" id="paws-bone" name="lifetime-tag" value="paws-bone" checked>
                <label for="paws-bone">
                  <img src="${imagePath}bone.png" alt="paws bone" class="outline shape" width="20" height="20">
                </label>
            </div>
            <div class="grid-item radio-wrapper">  
                <input type="radio" id="paws-circle" name="lifetime-tag" value="paws-circle">
                <label for="paws-circle">
                   <img src="${imagePath}circle.png" alt="paws circle" class="outline shape" width="20" height="20">
                </label>
            </div>
          </div>
        </div>
        <div class="wrapper column-half">
          <p class="content-center">Details:</p>
          <ul>
            <li>Available in 2 design options:<br>Traditional (white/red), Pet Paws (black/white)</li>
            <li>Available in 2 shapes: circle, bone</li>
            <li>Available in 2 sizes: small, large</li>
            <li>Long lasting and durable</li>
            <li>Includes your pet's unique microchip number and name</li>
            <li>Lifetime warranty - if damaged and unreadable (not if lost)</li>
            <li>Highly visible design</li>
          </ul>
          <hr>
          <h5>Tag Size:</h5>
          <select id="tag-size" name="tag-size">
            <option value="small">Small</option>
            <option value="large">Large</option>
          </select>          
          <p><span id="pricePerTagL">$${pricePerTagLifetimeSmall}</span> &nbsp; + &nbsp; Shipping</p>
          <br>
          <label for="quantitySelectL">Quantity:</label>
          <select id="quantitySelectL" name="quantitySelectL">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
          <div class="wrapper wrapper-text-center">
            <button type="button" id="addToCartL" ${disableActionButtons}>Add to Cart</button>
          </div>
          <p class="content-center">Order by phone: <a href="tel:18665972424">1-866-597-2424</a></p>
        </div>
      </div>
      
      <hr>
      <div class="wrapper wrapper-text-center">
            <button type="submit" id="continue" ${disableActionButtons}>View Summary</button>
      </div>
    </form>
    <div id="shopping-cart-container"></div>
  `;

  // initialize
  updateTagImage();
  displayShoppingCart();
  if (callShowGeneralErrorMessage) {
    showGeneralErrorMessage();
  }

  // show/hide sections based on tagType
  const sectionMetal = block.querySelector('.wrapper.metal');
  const sectionLifetime = block.querySelector('.wrapper.lifetime');
  sectionLifetime.style.display = 'none'; // initial: hide lifetime section
  const tagTypeRadioButtons = block.querySelectorAll('input[name="tagType"]');
  tagTypeRadioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      if (event.target.value === 'lifetime') {
        sectionMetal.style.display = 'none'; // hide metal section
        sectionLifetime.style.display = 'flex';
      } else {
        sectionMetal.style.display = 'flex';
        sectionLifetime.style.display = 'none'; // hide lifetime section
      }
    });
  });

  // update tag image based on user selection
  const allRadioButtons = block.querySelectorAll('input[type="radio"]');
  allRadioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', () => {
      updateTagImage();
    });
  });

  // price for a Lifetime tag based on size {small, large}
  const pricePerTagLifetime = block.querySelector('#pricePerTagL');
  const tagSizeSelect = block.querySelector('#tag-size');
  tagSizeSelect.addEventListener('change', (event) => {
    if (event.target.value === 'small') {
      pricePerTagLifetime.textContent = `$${pricePerTagLifetimeSmall}`;
    } else {
      pricePerTagLifetime.textContent = `$${pricePerTagLifetimeLarge}`;
    }
  });

  // add to cart: metal tag
  const addToCartM = block.querySelector('#addToCartM');
  addToCartM.addEventListener('click', () => {
    const color = document.querySelector('input[name="colors"]:checked').value; // {red, teal, charcoal}
    const shape = document.querySelector('input[name="shapes"]:checked').value; // {bone, heart}
    const quantity = parseInt(block.querySelector('#quantitySelectM').value, 10);
    const priceEach = pricePerTagMetal;
    const colorUppercase = uppercaseFirstLetter(color);
    const shapeUppercase = uppercaseFirstLetter(shape);
    const name = `${colorUppercase} ${shapeUppercase} Metal Tag`; // ex: Red Heart Metal Tag
    const id = getProductIdFromName(name);
    addItemToCart(id, name, quantity, priceEach);
  });
  // add to cart: lifetime tag
  const addToCartL = block.querySelector('#addToCartL');
  addToCartL.addEventListener('click', () => {
    const shapeAndKind = document.querySelector('input[name="lifetime-tag"]:checked').value; // {traditional-bone, traditional-circle, paws-bone, paws-circle}
    const [kind, shape] = shapeAndKind.split('-');
    const quantity = parseInt(block.querySelector('#quantitySelectL').value, 10);
    const priceEach = tagSizeSelect.value === 'small' ? pricePerTagLifetimeSmall : pricePerTagLifetimeLarge;
    const suffix = tagSizeSelect.value === 'small' ? 'Sm' : 'Lg';
    const kindUppercase = uppercaseFirstLetter(kind);
    const shapeUppercase = uppercaseFirstLetter(shape);
    const prefix = kindUppercase === 'Paws' ? 'Pet ' : '';
    const dash = '–'; // en-dash (as opposed to hyphen or an em dash)
    const name = `${prefix}${kindUppercase} ${shapeUppercase} ${dash} ${suffix}`; // ex: Pet Paws Bone – Sm
    const id = getProductIdFromName(name);
    addItemToCart(id, name, quantity, priceEach);
  });

  await updateShoppingCartFromBackend();

  // continue button
  const continueButton = document.querySelector('button[type="submit"]');
  continueButton.addEventListener('click', async (event) => {
    event.preventDefault();
    executeSubmit();
  });
}
