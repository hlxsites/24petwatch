import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import {
  API_BASE_URL,
  STEP_2_URL,
  POSTAL_CODE_CANADA_REGEX,
  EMAIL_REGEX,
  COOKIE_NAME,
  setCombinedCookie,
  getCombinedCookie,
  deleteCookie,
} from './tag-utils.js';

let petIdValue = ''; // if a previous cookie is present, will be set
let ownerIdValue = ''; // (ditto)

let haveSpecies = false; // {Dog, Cat}
let haveType = false; // {PureBreed, Mixed}

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
  checkmark.setAttribute('style', 'opacity: 0;'); // hide
}

function showGeneralErrorMessage(errorMessage = 'Please correct the errors in the form') {
  const errorElement = document.querySelector('.error-message.general-error-message');
  errorElement.textContent = errorMessage;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = '';
  }, 5000);
}

function buildOwnerPayload(emailValue, zipCodeValue) {
  return {
    payload: {
      email: emailValue,
      zipCode: zipCodeValue,
      cartFlow: 3, // hardcoded: tag
      partnerID: 84, // hardcoded
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

async function executeSubmit(breedIdValue) {
  const apiErrorMsg = 'Cannot continue at this time.  Please try again later.';
  const petNameValue = document.querySelector('#petName').value;
  try {
    // Step 1: Create the Owner
    const emailValue = document.querySelector('#email').value;
    const zipCodeValue = document.querySelector('#zipCode').value;
    let response = await fetch(`${API_BASE_URL}/Owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOwnerPayload(emailValue, zipCodeValue)),
    });
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
      return;
    }
    let data = await response.json();
    ownerIdValue = data.id;
    // Step 2: Create the Pet that belongs to the Owner
    const microchipIdValue = document.querySelector('#microchipId').value;
    const selectedSpecies = document.querySelector('input[name="speciesId"]:checked');
    const speciesIdValue = (selectedSpecies.value === 'Dog') ? 1 : 2; // 1 = Dog, 2 = Cat
    const selectedType = document.querySelector('input[name="typeId"]:checked');
    const typeIdValue = (selectedType.value === 'Purebreed'); // true = PureBreed, false = Mixed
    const petPayload = {
      payload: {
        ownerId: ownerIdValue,
        breedId: breedIdValue,
        microchipId: microchipIdValue,
        petName: petNameValue,
        speciesId: speciesIdValue,
        pureBreed: typeIdValue,
        conditions: [],
      },
    };
    response = await fetch(`${API_BASE_URL}/Pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(petPayload),
    });
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
      return;
    }
    data = await response.json();
    petIdValue = data.id;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error continuing from Step 1 to Step 2:', error);
    showGeneralErrorMessage(apiErrorMsg);
    return;
  }
  // remember the critical information for future steps
  setCombinedCookie(COOKIE_NAME, [petNameValue, petIdValue, ownerIdValue]);
  window.location.href = `.${STEP_2_URL}`; // ex: './/tag-select'
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
  if (!valid) {
    showErrorMessage(element, message);
    return null;
  }
  removeAnyErrorMessage(element, true);
  return trimmedValue;
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
      showErrorMessage(element, message);
      return null; // postal code not found
    }
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
      return null;
    }
    const data = await response.json();
    if (data.countryId === countryId) {
      removeAnyErrorMessage(element, true);
      return trimmedValue;
    }
    showErrorMessage(element, message); // postal code is not in the correct country
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error with validating the postal code:', error);
    showGeneralErrorMessage(apiErrorMsg);
    return null;
  }
}

async function refreshListOfBreeds(isDog, isPureBreed) {
  const countryId = (isCanada) ? 1 : 2; // 1 = Canada, 2 = USA
  const speciesId = (isDog) ? 1 : 2; // 1 = Dog, 2 = Cat
  const purebreed = (isPureBreed) ? 'true' : 'false';
  const endPoint = `Utility/GetBreeds?countryId=${countryId}&speciesId=${speciesId}&purebreed=${purebreed}`;
  const apiErrorMsg = 'Cannot retrieve the list of breeds from the server.  Please try again later.';

  try {
    const response = await fetch(`${API_BASE_URL}/${endPoint}`);
    if (!response.ok) {
      showGeneralErrorMessage(apiErrorMsg);
      return;
    }
    const data = await response.json();
    const breedIdNameList = document.querySelector('#breedIdNameList');
    breedIdNameList.innerHTML = '';
    data.forEach((breed) => {
      // build like: <option value="Poodle" breed-id="99999"></option>
      const option = document.createElement('option');
      option.value = breed.breedname;
      option.setAttribute('breed-id', breed.breedID);
      breedIdNameList.appendChild(option);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There was an error with refreshing the list of breeds:', error);
    showGeneralErrorMessage(apiErrorMsg);
    return;
  }

  // Since we changed the list of breeds, reset the breedIdName field
  const breedIdName = document.querySelector('input[id="breedIdName"]');
  breedIdName.value = '';
  // Ensure any checkmark is hidden
  const checkmark = breedIdName.parentElement.querySelector('.checkmark');
  checkmark.setAttribute('style', 'opacity: 0;'); // hide checkmark

  // disable the submit button
  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = true;
}

// returns the breedId integer number associated with the selected breed, or 0 if not valid
function getValidatedBreedId() {
  const breedIdName = document.querySelector('input[id="breedIdName"]');
  const inputVal = breedIdName.value.trim();
  const submitButton = document.querySelector('button[type="submit"]');
  const options = document.querySelectorAll('#breedIdNameList option');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < options.length; i++) {
    if (options[i].value === inputVal) {
      removeAnyErrorMessage(breedIdName, true);
      return options[i].getAttribute('breed-id');
    }
  }
  // if the form was valid, it no longer is
  if (!submitButton.disabled) {
    submitButton.disabled = true;
    showGeneralErrorMessage();
  }
  // reset the breed field
  breedIdName.value = ''; // reset
  showErrorMessage(breedIdName, 'Please select a breed from the list');
  return 0;
}

function checkFieldsValidity() {
  const submitButton = document.querySelector('button[type="submit"]');
  const inputFields = document.querySelectorAll('input');

  let allFieldsValid = true; // assume
  inputFields.forEach((inputField) => {
    if (!inputField.checkValidity()) {
      allFieldsValid = false;
    }
  });
  submitButton.disabled = !allFieldsValid;
}

async function getOwnerInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/Owner/${ownerIdValue}`);
    if (!response.ok) {
      throw new Error('Network response was not ok when attempting to retrieve the owner info'); // caught below
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

async function getPetInfo(petNameValue) {
  try {
    const response = await fetch(`${API_BASE_URL}/Pet/${petIdValue}`);
    if (!response.ok) {
      throw new Error('Network response was not ok when trying to retrieve the pet info'); // caught below
    }
    const data = await response.json();
    if (data.petName === petNameValue && data.ownerId === ownerIdValue) {
      return data;
    }
    return null; // pet info does not match the cookie
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch pet information:', error);
    return null;
  }
}

function getBreedNameForId(breedId) {
  const breedIdAsString = breedId.toString();
  const options = document.querySelectorAll('#breedIdNameList option');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < options.length; i++) {
    if (options[i].getAttribute('breed-id') === breedIdAsString) {
      return options[i].value;
    }
  }
  return '';
}

function selectBreedId(breedId) {
  const breedIdAsString = breedId.toString();
  const options = document.querySelectorAll('#breedIdNameList option');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < options.length; i++) {
    if (options[i].getAttribute('breed-id') === breedIdAsString) {
      options[i].selected = true;
      return;
    }
  }
}

async function initializeFormFromCookieInfo(petNameValue) {
  // create events to trigger field validations
  const triggerEventInput = new Event('input');
  const triggerEventBlur = new Event('blur');

  // pet name
  const petName = document.querySelector('#petName');
  petName.value = petNameValue;
  petName.dispatchEvent(triggerEventInput);

  // owner's personal info
  getOwnerInfo().then((ownerInfo) => {
    if (ownerInfo) {
      const zipCode = document.querySelector('#zipCode');
      const email = document.querySelector('#email');
      zipCode.value = ownerInfo.zipCode;
      email.value = ownerInfo.email;
      zipCode.dispatchEvent(triggerEventBlur);
      email.dispatchEvent(triggerEventBlur);
    }
  });

  // pet's info
  getPetInfo(petNameValue).then((petInfo) => {
    if (petInfo) {
      let isDog;
      let isPureBreed;
      // species
      haveSpecies = true; // global
      if (petInfo.speciesId === 1) { // Dog
        const speciesIdDog = document.querySelector('#speciesIdDog');
        speciesIdDog.checked = true;
        isDog = true;
      } else { // Cat
        const speciesIdCat = document.querySelector('#speciesIdCat');
        speciesIdCat.checked = true;
        isDog = false;
      }
      // type {PureBreed, Mixed}
      haveType = true; // global
      if (petInfo.pureBreed) {
        const typeIdPurebreed = document.querySelector('#typeIdPurebreed');
        typeIdPurebreed.checked = true;
        isPureBreed = true;
      } else {
        const typeIdMixed = document.querySelector('#typeIdMixed');
        typeIdMixed.checked = true;
        isPureBreed = false;
      }
      // breed
      refreshListOfBreeds(isDog, isPureBreed).then(() => {
        selectBreedId(petInfo.breedId);
        const breedIdName = document.querySelector('input[id="breedIdName"]');
        const breedName = getBreedNameForId(petInfo.breedId);
        breedIdName.value = breedName;
        removeAnyErrorMessage(breedIdName, true);
      });
      // microchip
      const microchipId = document.querySelector('#microchipId');
      microchipId.value = petInfo.microchipId;
      microchipId.dispatchEvent(triggerEventInput);
    }
  });

  // enable the submit button after a short delay
  const submitButton = document.querySelector('button[type="submit"]');
  setTimeout(() => {
    submitButton.disabled = false;
  }, 1000);
}

export default async function decorateStep1(block) {
  // add in the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/pet-tag-quote/tag-quote.css';
  document.head.appendChild(link);

  // create the HTML
  block.innerHTML = jsx`
    <form id="tag-quote-form">
      <h3>Tags for your pet</h3>
      <p class="wrapper-text-center">To get started, please enter your pet's information.</p>
      <hr/>
      <div class="wrapper flex-wrapper">
        <label>My Pet is a*</label>
        <div class="radio-wrapper">
          <input type="radio" id="speciesIdDog" name="speciesId" value="Dog">
          <label for="speciesIdDog">Dog</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="speciesIdCat" name="speciesId" value="Cat">
          <label for="speciesIdCat">Cat</label>
        </div>
      </div>
      <div class="wrapper flex-wrapper">
        <label>My Pet is a*</label>
        <div class="radio-wrapper">
          <input type="radio" id="typeIdPurebreed" name="typeId" value="Purebreed">
          <label for="typeIdPurebreed">Purebreed</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="typeIdMixed" name="typeId" value="Mixed">
          <label for="typeIdMixed">Mixed</label>
        </div>
      </div>
      <div class="wrapper">
        <input type="text" id="breedIdName" name="breedIdName" list="breedIdNameList" placeholder="Start typing..." minlength="2" required>
        <label for="breedIdName" class="float-label">My Pet's breed*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="petName" name="petName" placeholder="" minlength="1" maxlength="80" required>
        <label for="petName" class="float-label">My Pet's name*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="zipCode" name="zipCode" placeholder="" maxlength="7" required>
        <label for="zipCode" class="float-label">Postal Code*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="email" id="email" name="email" placeholder="" maxlength="320" required>
        <label for="email" class="float-label">Email Address*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="microchipId" name="microchipId" placeholder="Enter up to 15 digits (ABC123...)" minlength="9" maxlength="15" required>
        <label for="microchipId" class="float-label">Microchip number*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper wrapper-text-center">
        <button type="submit" id="continue">Continue ></button>
      </div>
      <div class="error-message general-error-message content-center"></div>
      <datalist id="breedIdNameList"></datalist> <!-- dynamically populated -->
    </form>
    `;

  // field validations
  const AT_LEAST_ONE_SYMBOL_REGEX = /.+/;
  const MICROCHIP_REGEX = /^([A-Z0-9]{15}|[A-Z0-9]{10}|[A-Z0-9]{9})$/i;

  const form = document.querySelector('#tag-quote-form');
  const petName = form.querySelector('#petName');
  const zipCode = form.querySelector('#zipCode');
  const email = form.querySelector('#email');
  const microchipId = form.querySelector('#microchipId');

  petName.addEventListener('input', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'Pet name is required');
  });
  zipCode.addEventListener('blur', (event) => {
    validatePostalCode(event.target, POSTAL_CODE_CANADA_REGEX, 'Please enter a valid postal code');
  });
  email.addEventListener('blur', (event) => {
    validateField(event.target, EMAIL_REGEX, 'A valid email is required');
  });
  microchipId.addEventListener('input', (event) => {
    validateField(event.target, MICROCHIP_REGEX, "We're sorry, we cannot offer tags for an animal without a microchip");
  });

  // breedIdName listener ... used as a side effect to validate the selected breed
  const breedIdName = form.querySelector('input[id="breedIdName"]');
  breedIdName.addEventListener('blur', getValidatedBreedId);

  // radio button listeners
  let isDog = false;
  let isPureBreed = false;
  const radioButtons = form.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      if (event.target.checked) {
        if (event.target.name === 'speciesId') {
          haveSpecies = true; // global
          isDog = (event.target.value === 'Dog');
        } else if (event.target.name === 'typeId') {
          haveType = true; // global
          isPureBreed = (event.target.value === 'Purebreed');
        }
        if (haveSpecies && haveType) {
          refreshListOfBreeds(isDog, isPureBreed);
        }
      }
    });
  });

  // listeners for the submit button
  const inputFields = document.querySelectorAll('input');
  inputFields.forEach((inputField) => {
    inputField.addEventListener('input', checkFieldsValidity);
  });
  checkFieldsValidity(); // set initial state
  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const breedId = getValidatedBreedId();
    if (breedId > 0) {
      await executeSubmit(breedId);
      return;
    }
    // if we get here, there was an error with the form.
    event.target.disabled = true; // disable the submit button
    showGeneralErrorMessage(); // show a general error message
  });

  // check for a previous cookie
  let petNameValue = '';
  [petNameValue = '', petIdValue = '', ownerIdValue = ''] = getCombinedCookie(COOKIE_NAME, []);
  if (petNameValue && petIdValue && ownerIdValue) {
    await initializeFormFromCookieInfo(petNameValue);
  } else {
    // ensure there is no leftover cookie
    deleteCookie(COOKIE_NAME);
  }
}
