import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import APIClient from './24petwatch-api.js';
import {
  API_BASE_URL,
  COOKIE_NAME,
  EMAIL_REGEX,
  POSTAL_CODE_CANADA_REGEX,
  STEP_2_URL,
  deleteCookie,
  getCombinedCookie,
  setCombinedCookie,
} from './tag-utils.js';

let petIdValue = ''; // if a previous cookie is present, will be set
let ownerIdValue = ''; // (ditto)

// formData - cache for form data. Example:
// formData.speciesId = '1';     // '1' = Dog, '2' = Cat
// formData.purebreed = 'true';  // 'true' = PureBreed, 'false' = Mixed
// formData.breed = { breedId: '99999', breedName: 'Poodle' };
// formData.fieldValid = { ... }; // see below
const formData = {
  fieldValid: {
    petName: false,
    zipCode: false,
    email: false,
    microchipId: false,
  },
};

// breedLists - cache for breeds. Indexed by the string: speciesId + purebreed (see formData above)
// breedLists['1true'] = [{ breedID: '99999', breedname: 'Poodle' }, ...]
const breedLists = {};

const APIClientObj = new APIClient();

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
  }, 10000);
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
    // Step 1: Update or create the Owner
    const ownerAlreadyExists = (ownerIdValue !== '');
    let method = (ownerAlreadyExists) ? 'PUT' : 'POST';
    let endPoint = (ownerAlreadyExists) ? `Owner/${ownerIdValue}` : 'Owner';
    const emailValue = document.querySelector('#email').value;
    const zipCodeValue = document.querySelector('#zipCode').value;
    let response = await fetch(`${API_BASE_URL}/${endPoint}`, {
      method: `${method}`,
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
    // Step 2: Update or create the Pet that belongs to the Owner
    let petAlreadyExists = false;
    if (ownerAlreadyExists && petIdValue) {
      // eslint-disable-next-line no-use-before-define,max-len
      const petInfo = await getInfoForExistingPet(petNameValue); // side effect: validates the pet belongs to the owner
      if (petInfo) {
        petAlreadyExists = true;
      }
    }
    method = (petAlreadyExists) ? 'PUT' : 'POST';
    endPoint = (petAlreadyExists) ? `Pet/${petIdValue}` : 'Pet';
    const microchipIdValue = document.querySelector('#microchipId').value;
    const isPureBreed = (formData.purebreed === 'true');
    const petPayload = {
      payload: {
        ownerId: ownerIdValue,
        breedId: breedIdValue,
        microchipId: microchipIdValue,
        petName: petNameValue,
        speciesId: parseInt(formData.speciesId, 10),
        pureBreed: isPureBreed,
        conditions: [],
      },
    };
    response = await fetch(`${API_BASE_URL}/${endPoint}`, {
      method: `${method}`,
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
  formData.fieldValid[element.name] = false; // assume the field is invalid

  // validate using the RegEx
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
  formData.fieldValid[element.name] = true;
  removeAnyErrorMessage(element, true);
  return trimmedValue;
}

async function validatePostalCode(element, regex, message) {
  formData.fieldValid[element.name] = false; // assume 'zipCode' validity is false

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
      formData.fieldValid[element.name] = true; // 'zipCode' is valid
      removeAnyErrorMessage(element, true);
      // eslint-disable-next-line no-use-before-define
      updateSubmitButtonState(); // possibly enable the submit button
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

function ensureBreedListIsPopulated() {
  return new Promise((resolve, reject) => {
    if (formData.speciesId && formData.purebreed
        && !breedLists[formData.speciesId + formData.purebreed]) {
      APIClientObj.getBreeds(formData.speciesId, formData.purebreed, (data) => {
        breedLists[formData.speciesId + formData.purebreed] = data;
        resolve();
      }, (status) => {
        // eslint-disable-next-line no-console
        console.log('Failed with status:', status);
        reject(status);
      });
    } else {
      resolve();
    }
  });
}

// returns the breedId integer number associated with the selected breed, or 0 if not valid
function getValidatedBreedId() {
  // return the breedId if it is present
  if (formData.breed && formData.breed.breedId) {
    return parseInt(formData.breed.breedId, 10); // return as an integer
  }

  // reset the breed field
  const breedIdName = document.querySelector('input[id="petBreed"]');
  breedIdName.value = ''; // reset
  showErrorMessage(breedIdName, 'Please select a breed from the list');
  return 0;
}

function updateSubmitButtonState() {
  const submitButton = document.querySelector('button[type="submit"]');

  let allFieldsValid = (formData.breed && formData.breed.breedId && formData.fieldValid);
  if (allFieldsValid) {
    // eslint-disable-next-line max-len
    const anyFieldInvalid = Object.keys(formData.fieldValid).some((field) => formData.fieldValid[field] === false);
    allFieldsValid = !anyFieldInvalid;
  }

  submitButton.disabled = !allFieldsValid;
  return allFieldsValid;
}

async function getInfoForExistingOwner() {
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

async function getInfoForExistingPet(petNameValue) {
  try {
    const response = await fetch(`${API_BASE_URL}/Pet/${petIdValue}`);
    if (!response.ok) {
      throw new Error('Network response was not ok when trying to retrieve the pet info'); // caught below
    }
    const data = await response.json();
    if (data.petName === petNameValue && data.ownerId === ownerIdValue) {
      return data;
    }
    return null; // pet info does not match the cookie's owner info
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch pet information:', error);
    return null;
  }
}

function getBreedNameForId(breedId) {
  const breedIdAsString = breedId.toString();
  if (formData.breed && formData.breed.breedId === breedIdAsString) {
    return formData.breed.breedName;
  }
  return '';
}

function selectBreedId(isDog, isPureBreed, breedId) {
  const index = ((isDog) ? '1' : '2') + isPureBreed.toString();
  const breedIdAsString = breedId.toString();
  if (breedLists[index]) {
    breedLists[index].forEach((breed) => {
      if (breed.breedID === breedIdAsString) {
        formData.breed = { breedId: breedIdAsString, breedName: breed.breedname };
      }
    });
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
  getInfoForExistingOwner().then((ownerInfo) => {
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
  getInfoForExistingPet(petNameValue).then(async (petInfo) => {
    if (petInfo) {
      let isDog;
      let isPureBreed;
      // species
      if (petInfo.speciesId === 1) { // Dog
        const speciesDog = document.querySelector('#speciesDog');
        speciesDog.checked = true;
        isDog = true;
      } else { // Cat
        const speciesCat = document.querySelector('#speciesCat');
        speciesCat.checked = true;
        isDog = false;
      }
      formData.speciesId = petInfo.speciesId.toString(); // '1' = Dog, '2' = Cat
      // type {PureBreed, Mixed}
      if (petInfo.pureBreed) {
        const typePurebred = document.querySelector('#pureBreedPurebred');
        typePurebred.checked = true;
        isPureBreed = true;
      } else {
        const typeMixed = document.querySelector('#pureBreedMixed');
        typeMixed.checked = true;
        isPureBreed = false;
      }
      formData.purebreed = petInfo.pureBreed.toString(); // 'true' = PureBreed, 'false' = Mixed
      // breed & associated breed list
      try {
        await ensureBreedListIsPopulated();
        selectBreedId(isDog, isPureBreed, petInfo.breedId);
        const petBreed = document.querySelector('input[id="petBreed"]');
        petBreed.value = getBreedNameForId(petInfo.breedId);
        if (petBreed.value) {
          removeAnyErrorMessage(petBreed, true);
        } else {
          showErrorMessage(petBreed, 'Please select a breed from the list.');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error populating the breed list:', error);
      }
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
  }, 2500);
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
          <input type="radio" id="speciesDog" name="speciesId" value="1">
          <label for="speciesDog">Dog</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="speciesCat" name="speciesId" value="2">
          <label for="speciesCat">Cat</label>
        </div>
      </div>
      <div class="wrapper flex-wrapper">
        <label>My Pet is a*</label>
        <div class="radio-wrapper">
          <input type="radio" id="pureBreedPurebred" name="purebreed" value="true">
          <label for="pureBreedPurebred">Purebred</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="pureBreedMixed" name="purebreed" value="false">
          <label for="pureBreedMixed">Mixed</label>
        </div>
      </div>
      <div class="wrapper">
        <input type="text" id="petBreed" name="petBreed" placeholder="Start Typing..." autocomplete="off" minlength="2" required>
        <label for="petBreed" class="float-label">My Pet's breed*</label>
        <span class="checkmark"></span>
        <div id="pet-breed-list"></div>
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
    // after the first 'blur' event, also validate the field on input
    zipCode.addEventListener('input', (inputEvent) => {
      validatePostalCode(inputEvent.target, POSTAL_CODE_CANADA_REGEX, 'Please enter a valid postal code');
      updateSubmitButtonState();
    });
  });
  email.addEventListener('blur', (event) => {
    validateField(event.target, EMAIL_REGEX, 'A valid email is required');
    // after the first 'blur' event, also validate the field on input
    email.addEventListener('input', (inputEvent) => {
      validateField(inputEvent.target, EMAIL_REGEX, 'A valid email is required');
      updateSubmitButtonState();
    });
  });
  microchipId.addEventListener('input', (event) => {
    validateField(event.target, MICROCHIP_REGEX, "We're sorry, we cannot offer tags for an animal without a microchip");
  });

  // ----- start: breed information -----
  const speciesAndPureBreedRadioGroups = document.querySelectorAll('input[type="radio"][name="speciesId"], input[type="radio"][name="purebreed"]');
  const petBreedInput = document.getElementById('petBreed');
  const resultsList = document.getElementById('pet-breed-list');

  // proxy so we can reuse code from other blocks
  function hideErrorMessage(element) {
    removeAnyErrorMessage(element);
  }

  function onRadioChange(event) {
    // examples:
    //   formData.speciesId = '1';     // '1' = Dog, '2' = Cat
    //   formData.purebreed = 'true';  // 'true' = PureBreed, 'false' = Mixed
    formData[event.target.name] = event.target.value;

    ensureBreedListIsPopulated();

    // since the {Dog,Cat} or {Purebred,Mixed} radio button changed, reset the breed field
    if (petBreedInput.value) {
      petBreedInput.value = '';
      petBreedInput.dispatchEvent(new Event('blur'));
    }
  }

  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<b>$1</b>');
  }

  function displayResults(results, query) {
    resultsList.innerHTML = '';
    resultsList.style.visibility = 'visible';
    const ul = document.createElement('ul');
    resultsList.appendChild(ul);

    results.forEach((result) => {
      const li = document.createElement('li');
      li.setAttribute('data-breed-id', result.breedID);
      li.setAttribute('data-breed-name', result.breedname);
      li.innerHTML = highlightMatch(result.breedname, query);
      ul.appendChild(li);
    });
  }

  function clearResults() {
    resultsList.style.visibility = 'hidden';
    resultsList.innerHTML = '';
    updateSubmitButtonState();
  }

  function petBreedInputHandler(event) {
    const query = event.target.value.toLowerCase();

    if (query.length >= 2 && breedLists[formData.speciesId + formData.purebreed]) {
      const results = breedLists[formData.speciesId + formData.purebreed]
        .filter((breed) => breed.breedname.toLowerCase().includes(query));
      if (results.length > 0) {
        displayResults(results, query);
      } else {
        clearResults('No results found');
      }
    } else {
      clearResults('Clear');
    }
  }

  function petBreedBlurHandler(event) {
    if (!formData.breed || !formData.breed.breedName) {
      event.target.value = '';
    }
    if (formData.breed && formData.breed.breedName
        && formData.breed.breedName !== event.target.value) {
      formData.breed = {};
      event.target.value = '';
    }

    if (event.target.value === '') {
      showErrorMessage(event.target, 'Please select a breed from the list.');
    } else {
      hideErrorMessage(event.target);
    }
  }

  resultsList.addEventListener('click', (event) => {
    const liElement = event.target.closest('li');
    if (liElement) {
      const breedId = liElement.getAttribute('data-breed-id');
      const breedName = liElement.getAttribute('data-breed-name');
      formData.breed = { breedId, breedName };
      petBreedInput.value = breedName;
      clearResults();
      hideErrorMessage(petBreedInput);
    }
  });

  petBreedInput.addEventListener('input', petBreedInputHandler);
  petBreedInput.addEventListener('blur', petBreedBlurHandler);

  speciesAndPureBreedRadioGroups.forEach((radioInput) => {
    radioInput.addEventListener('change', onRadioChange);
  });

  document.addEventListener('click', () => {
    clearResults();
  });
  // ----- end: breed information -----

  // listeners for the submit button
  const inputFields = document.querySelectorAll('input');
  inputFields.forEach((inputField) => {
    inputField.addEventListener('input', updateSubmitButtonState);
    inputField.addEventListener('blur', updateSubmitButtonState);
  });
  updateSubmitButtonState(); // set submit button state

  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.addEventListener('click', async (event) => {
    event.preventDefault();
    if (updateSubmitButtonState()) {
      const breedId = getValidatedBreedId();
      if (breedId > 0) {
        await executeSubmit(breedId);
        return;
      }
    }
    // if we get here, there was an error with the form.
    event.target.disabled = true; // disable the submit button
    showGeneralErrorMessage(); // show a general error message
  });

  // if a previous cookie is present and is valid, initialize the form
  let petNameValue = '';
  [petNameValue = '', petIdValue = '', ownerIdValue = ''] = getCombinedCookie(COOKIE_NAME, []);
  if (petNameValue && petIdValue && ownerIdValue) {
    await initializeFormFromCookieInfo(petNameValue);
  } else {
    // ensure there is no leftover cookie
    deleteCookie(COOKIE_NAME);
  }
}
