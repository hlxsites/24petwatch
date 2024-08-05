import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import APIClient, { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_FOR_PET_PLANS,
  EMAIL_REGEX,
  MICROCHIP_REGEX,
  POSTAL_CODE_CANADA_REGEX,
  PET_PLANS_LPM_URL,
  PET_PLANS_LPM_PLUS_URL,
  PET_PLANS_ANNUAL_URL,
  PET_PLANS_SUMMARY_QUOTE_URL,
  setCombinedCookie,
} from '../../scripts/24petwatch-utils.js';
import decorateSummaryQuote from './summary-quote.js';

const US_LEGAL_HEADER = '';
const US_LEGAL_CONSENT_FOR_PROMO_CONTACT = 'With your 24Pet® microchip, Pethealth Services (USA) Inc. may offer you free lost pet services, as well as exclusive offers, promotions and the latest information from 24Pet regarding microchip services. Additionally, PTZ Insurance Agency, Ltd. including its parents, PetPartners, Inc. and Independence Pet Group, Inc. and their subsidiaries (“collectively PTZ Insurance Agency, Ltd”) may offer you promotions and the latest information from 24Petprotect™ regarding pet insurance services and products. By checking “Continue”, Pethealth Services (USA) Inc. and PTZ Insurance Agency, Ltd. including its parents, PetPartners, Inc. and Independence Pet Group, Inc. and their subsidiaries (“collectively PTZ Insurance Agency, Ltd”) may contact you via commercial electronic messages, automatic telephone dialing systems, prerecorded/automated messages or text messages at the telephone number provided above, including your mobile number. These calls or emails are not a condition of the purchase of any goods or services. You understand that if you choose not to provide your consent, you will not receive the above-mentioned communications or free lost pet services, which includes being contacted with information in the event that your pet goes missing. You may withdraw your consent at any time.';
const US_LEGAL_CONSENT_FOR_LOST_PET_CONTACT = '';

const CA_LEGAL_HEADER = 'By completing this purchase, you understand and consent to the collection, storage and use of your personal data for the purposes outlined in the 24Petwatch Privacy Policy. Your personal data privacy rights are outlined therein.';
const CA_LEGAL_CONSENT_FOR_PROMO_CONTACT = 'With your 24Pet® microchip, Pethealth Services Inc. (“PSI”) may offer you free lost pet services, as well as exclusive offers, promotions and the latest information from24Pet regarding microchip services. Additionally, PSI’s affiliates, including PTZ Insurance Services Ltd., PetPartners, Inc. and Independence Pet Group, Inc., and their subsidiaries (collectively, “PTZ”) may offer you promotions and the latest information regarding pet insurance services and products. PSI may also have or benefit from contractual arrangements with third parties (“Partners”) who may offer you related services, products, offers and/or promotions. By giving consent, you agree that PSI, its Partners and/or PTZ may contact you for the purposes identified herein via commercial electronic messages at the e-mail address you provided, via mailer at the mailing address you provided and/or via automatic telephone dialing systems, pre-recorded/automated messages and/or text messages at the telephone number(s) you provided. Data and message rates may apply. This consent is not a condition of the purchase of any goods or services. You understand that if you choose not to provide your consent, you will not receive the above-mentioned communications or free lost pet services, which includes being contacted with information in the event that your pet goes missing. You may withdraw your consent at any time.';
const CA_LEGAL_CONSENT_FOR_LOST_PET_CONTACT = 'I agree that 24Petwatch® may release my contact information to anyone who finds my pet in order to facilitate pet recovery.';

const CART_FLOW = 2; // membership

function decorateLeftBlock(block, apiBaseUrl) {
  // prepare for Canada vs US
  const zipcodeLabel = isCanada ? 'Postal code*' : 'Zip code*';
  const zipcodePlaceholder = isCanada ? 'A1A 1A1' : '00000';
  const privacyPolicyURL = isCanada ? '/ca/privacy-policy' : '/privacy-policy';
  const legalHeader = isCanada
    ? CA_LEGAL_HEADER : US_LEGAL_HEADER;
  const legalConsentForPromoContact = isCanada
    ? CA_LEGAL_CONSENT_FOR_PROMO_CONTACT : US_LEGAL_CONSENT_FOR_PROMO_CONTACT;
  const legalConsentForLostPetContact = isCanada
    ? CA_LEGAL_CONSENT_FOR_LOST_PET_CONTACT : US_LEGAL_CONSENT_FOR_LOST_PET_CONTACT;
  let termsAndConditionsDataConsent = '';
  if (legalConsentForLostPetContact) {
    termsAndConditionsDataConsent = jsx`
      <div class="wrapper checkbox-text-wrapper">
        <div><input class="termsAndConditions" id="dataConsent" name="dataConsent" type="checkbox" autocomplete="off" /></div>
        <div class="text">${legalConsentForLostPetContact}</div>
      </div>
    `;
  }

  // create the HTML for the left block
  block.children[0].children[0].innerHTML += jsx`
    <h2>Let's start by getting to know your pet.</h2>
    <p><i>*All fields are required.</i></p>
    <form id="pet-info">
      <div class="wrapper">
        <input type="text" id="petName" name="petName" placeholder="Example: Bonita" maxlength="12" required>
        <label for="petName" class="float-label">Firstly, what's their name?*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper flex-wrapper">
        <label>Is your pet a*</label>
        <div class="radio-wrapper">
          <input type="radio" id="speciesDog" name="speciesId" value="1">
          <label for="speciesDog">Dog</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="speciesCat" name="speciesId" value="2">
          <label for="speciesCat">Cat</label>
        </div>
        <div class="error-message"></div>
      </div>
      <div class="wrapper flex-wrapper">
        <label>And are they*</label>
        <div class="radio-wrapper">
          <input type="radio" id="pureBreedPurebred" name="purebreed" value="true">
          <label for="pureBreedPurebred">Purebred</label>
        </div>
        <div class="radio-wrapper">
          <input type="radio" id="pureBreedMixed" name="purebreed" value="false">
          <label for="pureBreedMixed">Mixed</label>
        </div>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="petBreed" name="petBreed" placeholder="Start Typing..." autocomplete="off" required>
        <label for="petBreed" class="float-label">What's your pet's breed?*</label>
        <span class="checkmark"></span>
        <div id="pet-breed-list"></div>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="microchipNumber" name="microchipNumber" placeholder="Enter up to 15 digits (ABC123...)" required>
        <label for="microchipNumber" class="float-label">We'll need your pet's microchip number*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="email" id="email" name="email" placeholder="Example: yourname@email.com" maxlength="40" required>
        <label for="email" class="float-label">Email address*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="zipcode" name="zipcode" placeholder="${zipcodePlaceholder}" required>
        <label for="zipcode" class="float-label">${zipcodeLabel}</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper promocode-wrapper">
        <input type="text" id="promocode" name="promocode" placeholder="Enter Promo Code">
        <label for="promocode" class="float-label">Your Promo Code (optional)</label>
        <span class="checkmark"></span>
        <button type="button" id="apply-promo-code" class="secondary" disabled>Apply</button>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">${legalHeader}</div>
      <div class="wrapper checkbox-text-wrapper">
        <div><input class="termsAndConditions" id="agreement" name="agreement" type="checkbox" autocomplete="off" /></div>
        <div class="text">${legalConsentForPromoContact}</div>
      </div>
      ${termsAndConditionsDataConsent}
      <div class="wrapper wrapper-text-center">
        Please see <a href="${privacyPolicyURL}" target="_blank">Privacy Policy</a> for more information.
      </div>
      <div class="wrapper wrapper-text-center">
        <button type="button" id="submit">Continue \u003E</button>
      </div>
      <div class="error-message general-error-message content-center"></div>
    </form>
  `;

  const loaderWrapper = document.createElement('div');
  loaderWrapper.classList.add('loader-wrapper', 'hide');
  loaderWrapper.innerHTML = jsx`
    <div class="loader"></div>
    <div class="loader-txt">Loading</div>
    <div class="loader-bg"></div>
  `;
  document.body.insertBefore(loaderWrapper, document.body.firstChild);

  const APIClientObj = new APIClient(apiBaseUrl);
  const countryId = isCanada ? 1 : 2;
  const formData = {};
  const breedLists = {};
  const petNameInput = document.getElementById('petName');
  const speciesRadioGroups = document.querySelectorAll('input[type="radio"][name="speciesId"]');
  const pureBreedRadioGroups = document.querySelectorAll('input[type="radio"][name="purebreed"]');
  const petBreedInput = document.getElementById('petBreed');
  const emailInput = document.getElementById('email');
  const microchipInput = document.getElementById('microchipNumber');
  const resultsList = document.getElementById('pet-breed-list');
  const zipcodeInput = document.getElementById('zipcode');
  const promocodeInput = document.getElementById('promocode');
  const applyPromoCodeButton = document.getElementById('apply-promo-code');
  const checkboxes = document.querySelectorAll('.termsAndConditions');
  const submitButton = document.getElementById('submit');

  function showGeneralErrorMessage(errorMessage) {
    const errorElement = document.querySelector('.error-message.general-error-message');
    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = '';
    }, 10000);
  }

  function showLoader() {
    loaderWrapper.classList.remove('hide');
  }

  function hideLoader() {
    loaderWrapper.classList.add('hide');
  }

  function showErrorMessage(element, message) {
    const container = element.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');
    errorMessage.textContent = message;
    checkmark.setAttribute('style', 'opacity: 0;');
    container.classList.add('error');
  }

  function hideErrorMessage(element) {
    const container = element.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');
    errorMessage.textContent = '';
    checkmark.setAttribute('style', 'opacity: 1;');
    container.classList.remove('error');
  }

  function showErrorMessageRadioGroup(radioGroup, message) {
    const container = radioGroup[0].parentElement.parentElement;
    const errorMessage = container.querySelector('.error-message');
    errorMessage.textContent = message;
    container.classList.add('error');
  }

  function hideErrorMessageRadioGroup(radioGroup) {
    const container = radioGroup[0].parentElement.parentElement;
    const errorMessage = container.querySelector('.error-message');
    errorMessage.textContent = '';
    container.classList.remove('error');
  }

  function getCheckedRadioElement(radioGroup) {
    let checkedElement;
    radioGroup.forEach((radioButton) => {
      if (radioButton.checked) {
        checkedElement = radioButton;
      }
    });
    return checkedElement;
  }

  function onRadioChange(element) {
    // remember the selected value. Ex: formData.speciesId = '1' or formData.purebreed = 'true'
    formData[element.name] = element.value;

    // clear the breed input if we had a previous value
    if (petBreedInput.value) {
      petBreedInput.value = '';
      showErrorMessage(petBreedInput, 'Please tell us more about your pet above before selecting a breed.');
    }

    // if needed, get the next set of breeds
    if (formData.speciesId && formData.purebreed
      && !breedLists[formData.speciesId + formData.purebreed]) {
      APIClientObj.getBreeds(formData.speciesId, formData.purebreed, (data) => {
        breedLists[formData.speciesId + formData.purebreed] = data;
      }, (status) => {
        // eslint-disable-next-line no-console
        console.log('Failed updating the list of breeds:', status);
      });
    }
  }

  function petNameHandler() {
    const petName = petNameInput.value.trim();
    if (petName === '') {
      showErrorMessage(petNameInput, 'Please fill out your pet\'s name before continuing.');
      return false;
    }
    hideErrorMessage(petNameInput);
    formData.petName = petName;
    return true;
  }

  function emailHandler() {
    formData.email = ''; // reset our validated email
    const email = emailInput.value.trim();
    if (email !== '') {
      if (!EMAIL_REGEX.test(email)) {
        showErrorMessage(emailInput, 'Please enter a valid email address.');
        return false;
      }
      hideErrorMessage(emailInput);
      formData.email = email;
      return true;
    }
    showErrorMessage(emailInput, 'Please enter your email address before continuing.');
    return false;
  }

  function microchipHandler() {
    const microchip = microchipInput.value.trim();
    formData.microchip = ''; // reset our validated microchip
    if (microchip !== '') {
      if (!MICROCHIP_REGEX.test(microchip)) {
        showErrorMessage(microchipInput, 'We\'re sorry, we don\'t recognize the format of the chip number you have entered. Please double check the value you entered and try again.');
        return false;
      }
      hideErrorMessage(microchipInput);
      formData.microchip = microchip;
      return true;
    }
    showErrorMessage(microchipInput, 'Please enter your pet\'s microchip number before continuing.');
    return false;
  }

  function zipcodeHandler() {
    const errorMsg = isCanada ? 'Please enter a valid postal code' : 'Please enter a valid zip code';
    formData.zipCode = ''; // reset our validated zip code
    let zipCode = zipcodeInput.value.trim();
    let handlerStatus = true;

    if (zipCode === '') {
      showErrorMessage(zipcodeInput, errorMsg);
      return false;
    }
    if (isCanada) {
      if (!POSTAL_CODE_CANADA_REGEX.test(zipCode)) {
        showErrorMessage(zipcodeInput, errorMsg);
        return false;
      }
      zipCode = zipCode.replace(/ /g, ''); // remove any interior spaces
    }

    showLoader();
    APIClientObj.getCountryStates(zipCode, (data) => {
      if (data.zipCode && data.countryId === countryId) {
        hideErrorMessage(zipcodeInput);
        formData.zipCode = data.zipCode;
        handlerStatus = true;
      } else {
        showErrorMessage(zipcodeInput, errorMsg);
        zipcodeInput.value = ''; // valid zip code, but for the wrong country
        handlerStatus = false;
      }
    }, (status) => {
      if (status === 404) {
        showErrorMessage(zipcodeInput, errorMsg);
        zipcodeInput.value = '';
      } else {
        // eslint-disable-next-line no-console
        console.log('Failed to validate the postal code:', status);
      }
      handlerStatus = false;
    });
    hideLoader();

    return handlerStatus;
  }

  function petBreedHandler() {
    if (!formData.breed || !formData.breed.breedName) {
      petBreedInput.value = '';
    }
    if (formData.breed && formData.breed.breedName
      && formData.breed.breedName !== petBreedInput.value) {
      formData.breed = {};
      petBreedInput.value = '';
    }
    if (petBreedInput.value === '') {
      showErrorMessage(petBreedInput, 'Please tell us more about your pet above before selecting a breed.');
      return false;
    }
    hideErrorMessage(petBreedInput);
    return true;
  }

  function speciesHandler() {
    const speciesElement = getCheckedRadioElement(speciesRadioGroups);
    if (!speciesElement) {
      showErrorMessageRadioGroup(speciesRadioGroups, 'Please tell us what kind of pet you have before continuing.');
      return false;
    }
    onRadioChange(speciesElement);
    hideErrorMessageRadioGroup(speciesRadioGroups);
    return true;
  }

  function pureBreedHandler() {
    const pureBreedElement = getCheckedRadioElement(pureBreedRadioGroups);
    if (!pureBreedElement) {
      showErrorMessageRadioGroup(pureBreedRadioGroups, 'Please tell us more about your pet above before selecting a breed.');
      return false;
    }
    onRadioChange(pureBreedElement);
    hideErrorMessageRadioGroup(pureBreedRadioGroups);
    return true;
  }

  petNameInput.addEventListener('blur', () => {
    petNameHandler();
  });

  emailInput.addEventListener('blur', () => {
    emailHandler();
  });

  microchipInput.addEventListener('blur', () => {
    microchipHandler();
  });

  zipcodeInput.addEventListener('blur', () => {
    zipcodeHandler();
  });

  applyPromoCodeButton.addEventListener('click', () => {
    const promoCode = promocodeInput.value.trim();

    showLoader();
    APIClientObj.validateNonInsurancePromoCodeWithSpecies(
      promoCode,
      countryId,
      formData.speciesId ?? null,
      (data) => {
        if (data.isValid === true) {
          hideErrorMessage(promocodeInput);
          formData.promoCode = promoCode;
        } else {
          showErrorMessage(promocodeInput, 'Oops, looks like the promo code is invalid.');
          formData.promoCode = '';
        }
        hideLoader();
      },
      (status) => {
        // eslint-disable-next-line no-console
        console.log('Failed validating the promo code:', status);
        hideErrorMessage(promocodeInput);
        hideLoader();
      },
    );
  });

  promocodeInput.addEventListener('input', () => {
    if (promocodeInput.value.trim() === '') {
      hideErrorMessage(promocodeInput);
      applyPromoCodeButton.disabled = true;
    } else {
      applyPromoCodeButton.disabled = false;
    }
  });

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
  petBreedInput.addEventListener('blur', petBreedHandler);

  speciesRadioGroups.forEach((radioInput) => {
    radioInput.addEventListener('change', speciesHandler);
  });

  pureBreedRadioGroups.forEach((radioInput) => {
    radioInput.addEventListener('change', pureBreedHandler);
  });

  document.addEventListener('click', () => {
    clearResults();
  });

  function updateButtonState() {
    const allChecked = Array.from(checkboxes).every((checkbox) => checkbox.checked);
    submitButton.disabled = !allChecked;
  }
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', updateButtonState);
  });
  updateButtonState();

  async function saveOwner(ownerId) {
    try {
      // eslint-disable-next-line max-len
      const data = await APIClientObj.saveOwner(ownerId, formData.email, formData.zipCode, CART_FLOW);
      formData.ownerId = data.id;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to create/update the owner:', status);
      formData.ownerId = '';
    }
  }

  async function savePet(petId) {
    try {
      // eslint-disable-next-line max-len
      const data = await APIClientObj.savePet(petId, formData.ownerId, formData.petName, formData.breed.breedId, formData.speciesId, formData.purebreed, formData.microchip);
      formData.petId = data.id;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to create/update the pet:', status);
      formData.petId = '';
    }
  }

  function getUniqueProductNameForThisFlow() {
    const currentPath = window.location.pathname;
    let token = ' (LPM)'; // default
    if (currentPath.includes(PET_PLANS_LPM_URL)) {
      token = ' (LPM)';
    } else if (currentPath.includes(PET_PLANS_LPM_PLUS_URL)) {
      token = ' PLUS';
    } else if (currentPath.includes(PET_PLANS_ANNUAL_URL)) {
      token = 'Annual';
    }
    return token;
  }

  async function getSelectedProduct(petId) {
    try {
      formData.productId = ''; // reset
      // eslint-disable-next-line max-len
      const data = await APIClientObj.getAvailableProducts(petId); // returns all products for the pet
      const isPetPlan = (item) => item.itemGroupId.includes('Pet Recovery Services');
      const petPlans = data.reduce((acc, item) => {
        if (isPetPlan(item)) {
          acc.push({ name: item.itemName, recId: item.recId });
        }
        return acc;
      }, []);
      const nameThatIncludes = getUniqueProductNameForThisFlow();
      const matchingPlan = petPlans.find((plan) => plan.name.includes(nameThatIncludes));
      if (matchingPlan) {
        formData.productId = matchingPlan.recId; // remember the selected product
      }
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the selected product:', status);
      formData.productId = '';
    }
  }

  async function saveSelectedProduct(petId, productId) {
    try {
      await APIClientObj.saveSelectedProduct(petId, productId, 1, true);
      return true;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to create/update the pet:', status);
      return false;
    }
  }

  async function executeSubmit() {
    const apiErrorMsg = 'Cannot continue at this time.  Please try again later.';
    showLoader();

    const ownerId = (!formData.ownerId) ? '' : formData.ownerId;
    await saveOwner(ownerId); // Create or Update the owner
    if (!formData.ownerId) {
      showGeneralErrorMessage(apiErrorMsg);
      hideLoader();
      return;
    }

    const petId = (!formData.petId) ? '' : formData.petId;
    await savePet(petId); // Create or Update the pet
    if (!formData.petId) {
      showGeneralErrorMessage(apiErrorMsg);
      hideLoader();
      return;
    }

    await getSelectedProduct(formData.petId);
    if (!formData.productId) {
      showGeneralErrorMessage(apiErrorMsg);
      hideLoader();
      return;
    }
    if (!await saveSelectedProduct(formData.petId, formData.productId)) {
      showGeneralErrorMessage(apiErrorMsg);
      hideLoader();
      return;
    }

    hideLoader();

    // remember the critical information for future steps
    setCombinedCookie(COOKIE_NAME_FOR_PET_PLANS, [formData.ownerId, formData.petId]);
    window.location.href = `.${PET_PLANS_SUMMARY_QUOTE_URL}`; // ex: './summary-quote'
  }

  submitButton.addEventListener('click', () => {
    // verify we have all the required fields
    const fieldHandlers = [
      petNameHandler,
      emailHandler,
      speciesHandler,
      pureBreedHandler,
      petBreedHandler,
      microchipHandler,
      zipcodeHandler,
    ];
    let allPassed = true;

    for (let i = 0; i < fieldHandlers.length; i += 1) {
      const fieldHandler = fieldHandlers[i];
      if (!fieldHandler()) {
        allPassed = false;
      }
    }

    if (allPassed) {
      executeSubmit();
    } else {
      showGeneralErrorMessage('Please ensure all required fields are filled out.');
    }
  });
}

function decorateRightBlock(block) {
  const grayDiv = block.children[0].children[1];
  grayDiv.querySelectorAll('H2').forEach((h2) => {
    let nextSibling = h2.nextElementSibling;
    let pCount = 0;
    let wrapperDiv = null;

    while (nextSibling && nextSibling.tagName === 'P') {
      if (pCount % 3 === 0) {
        wrapperDiv = document.createElement('div');
        nextSibling.parentNode.insertBefore(wrapperDiv, nextSibling);
      }
      if (wrapperDiv) {
        wrapperDiv.appendChild(nextSibling);
      }
      nextSibling = wrapperDiv.nextElementSibling;
      pCount += 1;
    }
  });
}

export default async function decorate(block) {
  const apiBaseUrl = await getAPIBaseUrl();
  const currentPath = window.location.pathname;
  if (currentPath.includes(PET_PLANS_SUMMARY_QUOTE_URL)) {
    decorateSummaryQuote(block, apiBaseUrl); // Step 2 of 3
  } else { // Step 1 of 3
    decorateLeftBlock(block, apiBaseUrl);
    decorateRightBlock(block);
  }
}
