import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import Loader from './loader.js';
import APIClient from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_SAVED_OWNER_ID,
  SS_KEY_FORM_ENTRY_URL,
  CURRENCY_CANADA,
  CURRENCY_US,
  EMAIL_REGEX,
  MICROCHIP_REGEX,
  PET_PLANS_LPM_URL,
  PET_PLANS_LPM_PLUS_URL,
  PET_PLANS_ANNUAL_URL,
  PET_PLANS_SUMMARY_QUOTE_URL,
  setCookie,
  getQueryParam,
  getCookie,
  isSummaryPage,
  getSelectedProductAdditionalInfo,
  getItemInfoFragment,
} from '../../scripts/24petwatch-utils.js';
import { getConfigValue } from '../../scripts/configs.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';

const US_LEGAL_HEADER = '';
const US_LEGAL_CONSENT_FOR_PROMO_CONTACT = 'With your 24Pet® microchip, Pethealth Services (USA) Inc. may offer you free lost pet services, as well as exclusive offers, promotions and the latest information from 24Pet regarding microchip services. Additionally, PTZ Insurance Agency, Ltd. including its parents, PetPartners, Inc. and Independence Pet Group, Inc. and their subsidiaries (“collectively PTZ Insurance Agency, Ltd”) may offer you promotions and the latest information from 24Petprotect™ regarding pet insurance services and products. By checking “Continue”, Pethealth Services (USA) Inc. and PTZ Insurance Agency, Ltd. including its parents, PetPartners, Inc. and Independence Pet Group, Inc. and their subsidiaries (“collectively PTZ Insurance Agency, Ltd”) may contact you via commercial electronic messages, automatic telephone dialing systems, prerecorded/automated messages or text messages at the telephone number provided above, including your mobile number. These calls or emails are not a condition of the purchase of any goods or services. You understand that if you choose not to provide your consent, you will not receive the above-mentioned communications or free lost pet services, which includes being contacted with information in the event that your pet goes missing. You may withdraw your consent at any time.';
const US_LEGAL_CONSENT_FOR_LOST_PET_CONTACT = '';

const CA_LEGAL_HEADER = 'By completing this purchase, you understand and consent to the collection, storage and use of your personal data for the purposes outlined in the 24Petwatch Privacy Policy. Your personal data privacy rights are outlined therein.';
const CA_LEGAL_CONSENT_FOR_PROMO_CONTACT = 'With your 24Pet® microchip, Pethealth Services Inc. (“PSI”) may offer you free lost pet services, as well as exclusive offers, promotions and the latest information from 24Pet regarding microchip services. Additionally, PSI’s affiliates, including PTZ Insurance Services Ltd., PetPartners, Inc. and Independence Pet Group, Inc., and their subsidiaries (collectively, “PTZ”) may offer you promotions and the latest information regarding pet insurance services and products. PSI may also have or benefit from contractual arrangements with third parties (“Partners”) who may offer you related services, products, offers and/or promotions. By giving consent, you agree that PSI, its Partners and/or PTZ may contact you for the purposes identified herein via commercial electronic messages at the e-mail address you provided, via mailer at the mailing address you provided and/or via automatic telephone dialing systems, pre-recorded/automated messages and/or text messages at the telephone number(s) you provided. Data and message rates may apply. This consent is not a condition of the purchase of any goods or services. You understand that if you choose not to provide your consent, you will not receive the above-mentioned communications or free lost pet services, which includes being contacted with information in the event that your pet goes missing. You may withdraw your consent at any time.';
const CA_LEGAL_CONSENT_FOR_LOST_PET_CONTACT = 'I agree that 24Petwatch® may release my contact information to anyone who finds my pet in order to facilitate pet recovery.';

const CART_FLOW = 2; // membership

const apiErrorMsg = 'Cannot continue at this time.  Please try again later.';

const usedChipNumbers = new Set();

const promoResultKey = await getConfigValue('promo-result');

export default function formDecoration(block, apiBaseUrl) {
  // prepare for Canada vs US
  const currencyValue = isCanada ? CURRENCY_CANADA : CURRENCY_US;
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
        <div class="text"><label for="dataConsent">${legalConsentForLostPetContact}</label></div>
      </div>
    `;
  }

  const emailFieldHTML = jsx`
    <div class="wrapper">
      <input type="email" id="email" name="email" placeholder="Example: yourname@email.com" maxlength="40" required>
      <label for="email" class="float-label">Email address*</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
    </div>
  `;

  const zipcodeFieldHTML = jsx`
    <div class="wrapper">
      <input type="text" id="zipcode" name="zipcode" placeholder="${zipcodePlaceholder}" required>
      <label for="zipcode" class="float-label">${zipcodeLabel}</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
    </div>
  `;

  const promocodeFieldHTML = jsx`
    <div class="wrapper promocode-wrapper">
      <input type="text" id="promocode" name="promocode" placeholder="Enter Code">
      <label for="promocode" class="float-label">Promo/Coupon Code (optional)<div>*Only one promotional/coupon code can be used per transaction</div></label>
      <span class="checkmark"></span>
      <button type="button" id="apply-promo-code" class="secondary" disabled>Apply</button>
      <div class="error-message"></div>
    </div>
  `;

  const firstPageButtomsHTML = jsx`
    <div class="wrapper wrapper-text-center">
      <button type="button" id="submit">Continue \u003E</button>
    </div>
  `;

  const summaryPageButtomsHTML = jsx`
    <div class="wrapper wrapper-several-buttons">
      <button type="button" class="cancel" id="cancel">Cancel</button>
      <button type="button" id="add-pet">Add pet</button>
    </div>
  `;

  const dialogHTML = jsx`
    <dialog id="confirmation-dialog">
      <h3 id="confirmation-dialog-header"></h3>
      <p id="confirmation-dialog-note"></p>
      <div class="dialog-buttons-container">
        <button type="button" class="yes" id="confirmation-dialog-yes">Yes</button>
        <button type="button" class="no" id="confirmation-dialog-no" autofocus>No</button>
      </div>
    </dialog>
  `;

  // create the HTML for the left block
  block.innerHTML += jsx`
    ${!isSummaryPage() ? dialogHTML : ''}
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
      ${!isSummaryPage() ? emailFieldHTML : ''}
      ${!isSummaryPage() ? zipcodeFieldHTML : ''}
      ${!isSummaryPage() ? promocodeFieldHTML : ''}
      <div class="wrapper">${legalHeader}</div>
      <div class="wrapper checkbox-text-wrapper">
        <div><input class="termsAndConditions" id="agreement" name="agreement" type="checkbox" autocomplete="off" /></div>
        <div class="text"><label for="agreement">${legalConsentForPromoContact}</label></div>
      </div>
      ${termsAndConditionsDataConsent}
      <div class="wrapper wrapper-text-center">
        Please see <a href="${privacyPolicyURL}" target="_blank">Privacy Policy</a> for more information.
      </div>
      ${isSummaryPage() ? summaryPageButtomsHTML : firstPageButtomsHTML}
      <div class="error-message general-error-message content-center"></div>
    </form>
  `;

  Loader.addLoader();

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
  const cancelButton = document.getElementById('cancel');
  const addPetButton = document.getElementById('add-pet');

  function showGeneralErrorMessage(errorMessage) {
    const errorElement = document.querySelector('.error-message.general-error-message');
    errorElement.textContent = errorMessage;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = '';
    }, 10000);
  }

  function showErrorMessage(element, message) {
    const container = element.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');
    errorMessage.textContent = message;
    checkmark.setAttribute('style', 'opacity: 0;');
    container.classList.add('error');
  }

  function hideErrorMessage(element, showCheckmark = true) {
    const container = element.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');
    errorMessage.textContent = '';
    if (showCheckmark) checkmark.setAttribute('style', 'opacity: 1;');
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

  async function onRadioChange(element) {
    // clear the breed input if we had a previous value
    if (petBreedInput.value && formData[element.name] !== element.value) {
      petBreedInput.value = '';
      showErrorMessage(petBreedInput, 'Please tell us more about your pet above before selecting a breed.');
    }

    // remember the selected value. Ex: formData.speciesId = '1' or formData.purebreed = 'true'
    formData[element.name] = element.value;

    // if needed, get the next set of breeds
    await ensureBreedListIsPopulated();
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
    if (isSummaryPage()) {
      return true; // no need to validate email on the summary page
    }

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

      if (usedChipNumbers.has(microchip)) {
        showErrorMessage(microchipInput, 'This microchip number has already been used. Please enter a different microchip number.');
        return false;
      }

      hideErrorMessage(microchipInput);
      formData.microchip = microchip;
      return true;
    }
    showErrorMessage(microchipInput, 'Please enter your pet\'s microchip number before continuing.');
    return false;
  }

  const confirmationDialog = document.getElementById('confirmation-dialog');
  const confirmationDialogHeader = document.getElementById('confirmation-dialog-header');
  const confirmationDialogNote = document.getElementById('confirmation-dialog-note');
  const confirmationDialogYes = document.getElementById('confirmation-dialog-yes');
  const confirmationDialogNo = document.getElementById('confirmation-dialog-no');

  function openAnotherCountyPage() {
    confirmationDialogHeader.textContent = 'Country Changed';
    confirmationDialogNote.textContent = 'You appear to have entered a zip code for the wrong country. Would you like to be redirected to the appropriate page for your zip code?';
    confirmationDialog.showModal();
    confirmationDialogYes.onclick = () => {
      confirmationDialog.close();
      if (isCanada) {
        window.location.pathname = window.location.pathname.replace(/^\/ca/, '');
      } else {
        window.location.href = `/ca${window.location.pathname}`;
      }
    };
    confirmationDialogNo.onclick = () => {
      confirmationDialog.close();
    };
  }

  async function zipcodeHandler() {
    const errorMsg = isCanada ? 'Please enter a valid postal code' : 'Please enter a valid zip code';
    let zipCode = zipcodeInput.value.trim();
    let handlerStatus = true;

    if (zipCode === '') {
      showErrorMessage(zipcodeInput, errorMsg);
      return false;
    }
    if (zipCode === formData.zipCode) {
      return true; // already validated
    }

    formData.zipCode = ''; // reset our validated zip code

    if (isCanada) {
      zipCode = zipCode.replace(/ /g, ''); // remove any interior spaces
    }

    Loader.showLoader();
    try {
      await new Promise((resole, reject) => {
        APIClientObj.getCountryStates(zipCode, (data) => {
          if (data.zipCode && data.countryId === countryId) {
            hideErrorMessage(zipcodeInput);
            formData.zipCode = data.zipCode;
            handlerStatus = true;
          } else {
            showErrorMessage(zipcodeInput, errorMsg);
            openAnotherCountyPage();
            zipcodeInput.value = ''; // valid zip code, but for the wrong country
            handlerStatus = false;
          }
          resole();
        }, (status) => {
          handlerStatus = false;
          if (status === 404) {
            showErrorMessage(zipcodeInput, errorMsg);
            zipcodeInput.value = '';
            resole();
          } else {
            // eslint-disable-next-line no-console
            console.log('Failed to validate the postal code:', status);
            reject();
          }
        });
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Something went wrong during zip code validation', e);
    }
    Loader.hideLoader();

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

  async function promocodeHandler() {
    const promoCode = promocodeInput.value.trim();
    let handlerStatus = false;
    if (promoCode === '') {
      return true;
    }

    Loader.showLoader();
    try {
      await new Promise((resolve, reject) => {
        APIClientObj.validateNonInsurancePromoCodeWithSpecies(
          promoCode,
          countryId,
          formData.speciesId ?? null,
          formData.petId ?? null,
          (data) => {
            if (data[promoResultKey] === true) {
              hideErrorMessage(promocodeInput);
              formData.promoCode = promoCode;
              handlerStatus = true;
              resolve();
            } else {
              showErrorMessage(promocodeInput, 'This code is invalid.');
              formData.promoCode = '';
              handlerStatus = false;
              reject();
            }
            Loader.hideLoader();
          },
          (status) => {
            // eslint-disable-next-line no-console
            console.log('Failed validating the code:', status);
            hideErrorMessage(promocodeInput);
            Loader.hideLoader();
            handlerStatus = false;
            reject();
          },
        );
      });
    } catch (status) {
      handlerStatus = false;
    }
    return handlerStatus;
  }

  function updateButtonState() {
    const allChecked = Array.from(checkboxes).every((checkbox) => checkbox.checked);
    if (isSummaryPage()) {
      addPetButton.disabled = !allChecked;
    } else {
      submitButton.disabled = !allChecked;
    }
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

  async function savePromoCode(ownerId, petId, promoCode) {
    try {
      await APIClientObj.savePromoCode(ownerId, petId, promoCode);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the promo code:', status);
    }
  }

  async function savePet(petId = '') {
    try {
      formData.birthDate = '1900-01-01T00:00:00.000Z';
      // eslint-disable-next-line max-len
      const data = await APIClientObj.savePet(petId, formData.ownerId, formData.petName, formData.breed.breedId, formData.speciesId, formData.purebreed, formData.microchip, formData.birthDate);
      formData.petId = data.id;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to create/update the pet:', status);
      formData.petId = '';
    }
  }

  function getUniqueProductIdForThisFlow() {
    const currentPath = window.location.pathname;
    let token = 'PLH_000007'; // default
    if (currentPath.includes(PET_PLANS_LPM_URL)) {
      token = isCanada ? 'PHL_000006' : 'PLH_000007';
    } else if (currentPath.includes(PET_PLANS_LPM_PLUS_URL)) {
      // eslint-disable-next-line no-nested-ternary
      token = (parseInt(formData.speciesId, 10) === 1)
        ? (isCanada ? 'LPM-PLUS-CA' : 'LPM-PLUS') : (isCanada ? 'LPM-PLUS-CA-CATS' : 'LPM-PLUS-US-CATS');
    } else if (currentPath.includes(PET_PLANS_ANNUAL_URL)) {
      token = (parseInt(formData.speciesId, 10) === 1) ? 'Annual Plan-DOGS' : 'Annual Plan-CATS';
    }
    return token;
  }

  async function getAvailableProducts(petId) {
    let petPlans = [];
    try {
      // eslint-disable-next-line max-len
      const data = await APIClientObj.getAvailableProducts(petId); // returns all products for the pet
      const isPetPlan = (item) => item.itemGroupId.includes('Pet Recovery Services');
      petPlans = data.reduce((acc, item) => {
        if (isPetPlan(item)) {
          acc.push({ itemId: item.itemId, recId: item.recId, salesPrice: item.salesPrice });
        }
        return acc;
      }, []);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the available products:', status);
    }

    return petPlans;
  }

  async function findAndApplySelectedProduct(petId, productId) {
    try {
      formData.productId = ''; // reset
      // eslint-disable-next-line max-len
      const petPlans = await getAvailableProducts(petId);
      const matchingPlan = petPlans.find((plan) => plan.itemId === productId);
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

  function instrumentTrackingStep1() {
    const currentPath = window.location.pathname;
    let productType = null;

    if (currentPath.includes(PET_PLANS_LPM_URL)) {
      productType = 'Lifetime Protection Membership';
    } else if (currentPath.includes(PET_PLANS_LPM_PLUS_URL)) {
      productType = 'Lifetime Protection Membership Plus';
    } else if (currentPath.includes(PET_PLANS_ANNUAL_URL)) {
      productType = 'Annual Protection Membership';
    }

    // call instrument tracking
    const trackingData = {
      ecommerce: {
        // New GTM dataLayer
        product_type: productType, // annual protection membership
        items: [
          {
            item_name: productType,
            coupon: formData.promoCode,
            currency: currencyValue,
            discount: '', // not available until step 2
            item_category: 'membership',
            item_variant: '', // okay to be left empty
            microchip_number: formData.microchip,
            product_type: productType,
            price: '', // not available until step 2
            quantity: 1,
          },
        ],
      },
    };

    // send the GTM event
    trackGTMEvent('add_to_cart', trackingData);
  }

  async function executeSubmit() {
    Loader.showLoader();

    const ownerId = (!formData.ownerId) ? '' : formData.ownerId;
    await saveOwner(ownerId); // Create or Update the owner
    if (!formData.ownerId) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the owner.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    const petId = (!formData.petId) ? '' : formData.petId;
    await savePet(petId); // Create or Update the pet
    if (!formData.petId) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the pet.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    if (formData.promoCode) {
      await savePromoCode(formData.ownerId, formData.petId, formData.promoCode);
    }

    await findAndApplySelectedProduct(formData.petId, getUniqueProductIdForThisFlow());
    if (!formData.productId) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the selected product.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }
    if (!await saveSelectedProduct(formData.petId, formData.productId)) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the selected product.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    // call instrument tracking
    instrumentTrackingStep1();

    Loader.hideLoader();

    // remember the critical information for future steps
    setCookie(COOKIE_NAME_SAVED_OWNER_ID, formData.ownerId);
    sessionStorage.setItem(SS_KEY_FORM_ENTRY_URL, window.location.href);
    window.location.href = `.${PET_PLANS_SUMMARY_QUOTE_URL}`; // ex: './summary-quote'
  }

  async function executeAddPet2Step(recId) {
    Loader.showLoader();
    if (!await saveSelectedProduct(formData.petId, recId)) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the selected product.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    Loader.hideLoader();
    window.location.reload();
  }

  async function executeAddPet() {
    Loader.showLoader();

    const { ownerId } = formData;
    if (!ownerId) {
      // eslint-disable-next-line no-console
      console.log('Owner ID is missing.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    await savePet(); // Create or Update the pet
    if (!formData.petId) {
      // eslint-disable-next-line no-console
      console.log('Failed to save the pet.');
      showGeneralErrorMessage(apiErrorMsg);
      Loader.hideLoader();
      return;
    }

    const availableProducts = await getAvailableProducts(formData.petId);

    if (availableProducts) {
      block.innerHTML = ''; // clear the form
      availableProducts.forEach((product) => {
        const additionalInfo = getSelectedProductAdditionalInfo(product.itemId);
        if (additionalInfo) {
          block.innerHTML += jsx`
          <div class="available-product">
            <div class="price-info">
                <h2>${additionalInfo.name}</h2>
                <p>$${product.salesPrice}</p>
                <p>${additionalInfo.priceComment}</p>
            </div>
            <div class="product-fragment" data-product-id="${product.itemId}"></div>
            <div class="button-wrapper"><button class="choose-product" data-product-rec-id="${product.recId}">Add</button></div>
          </div>
          `;
        }
      });

      // Loading item info fragments
      const itemInfoFragmetDivs = document.querySelectorAll('.product-fragment');
      itemInfoFragmetDivs.forEach((infoFragmentDiv) => {
        const itemId = infoFragmentDiv.getAttribute('data-product-id');
        getItemInfoFragment(itemId).then((fragment) => {
          infoFragmentDiv.append(fragment);
        });
      });

      const chooseProductButtons = document.querySelectorAll('.choose-product');
      chooseProductButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
          executeAddPet2Step(event.target.getAttribute('data-product-rec-id'));
        });
      });
    } else {
      showGeneralErrorMessage(apiErrorMsg);
    }

    Loader.hideLoader();
  }

  async function getOwner(ownerId) {
    try {
      const data = await APIClientObj.getOwner(ownerId);
      return data;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the owner:', ownerId, ' status:', status);
      return [];
    }
  }

  async function getPet(petId, ownerId) {
    try {
      const data = await APIClientObj.getPet(petId);
      if (data.ownerId !== ownerId) {
        // eslint-disable-next-line no-console
        console.log('The pet:', petId, 'does not belong to the owner:', ownerId);
        return [];
      }
      return data;
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the pet:', petId, 'for its owner', ownerId, ' status:', status);
      return [];
    }
  }

  function getBreedNameForId(breedId) {
    let breedName = '(unknown)'; // default
    if (breedLists[formData.speciesId + formData.purebreed]) {
      // eslint-disable-next-line max-len
      const breed = breedLists[formData.speciesId + formData.purebreed].find((b) => b.breedID === breedId.toString());
      if (breed) {
        breedName = breed.breedname;
      }
    }
    return breedName;
  }

  async function prefillFormIfPossible() {
    // the owner info must come from the cookie
    const ownerId = getCookie(COOKIE_NAME_SAVED_OWNER_ID);

    // promo code from query param
    const promoCode = getQueryParam('promo_code');
    if (promoCode) {
      promocodeInput.value = promoCode.trim();
      Loader.showLoader();
      await promocodeHandler();
      Loader.hideLoader();
    }

    // owner {email, zipCode}
    if (!ownerId) {
      return;
    }
    Loader.showLoader();
    let data = await getOwner(ownerId);
    Loader.hideLoader();
    if (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) {
      return;
    }
    if (isCanada && data.countryID !== 1) {
      return;
    }
    formData.ownerId = ownerId;

    if (!isSummaryPage()) {
      if (data.email) {
        emailInput.value = data.email;
        emailHandler();
      }
      if (data.zipCode) {
        Loader.showLoader();
        zipcodeInput.value = data.zipCode;
        await zipcodeHandler();
        Loader.hideLoader();
      }
    }

    // Collect used microchip numbers
    try {
      const petsList = await APIClientObj.getPets(ownerId);
      petsList.forEach((pet) => usedChipNumbers.add(pet.microchipId));
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the pets for owner:', ownerId, ' status:', status);
    }

    // pet {petName, microchip, speciesId, purebreed, breed {breedId, breedName}}
    const petId = getQueryParam('petId');
    if (!petId) {
      return;
    }
    data = await getPet(petId, ownerId);
    if (!data || (Array.isArray(data) ? data.length === 0 : Object.keys(data).length === 0)) {
      return;
    }
    formData.petId = petId;
    if (data.petName) {
      petNameInput.value = data.petName;
      petNameHandler();
    }
    if (data.microchipId) {
      microchipInput.value = data.microchipId;
      // Remove microchip number of current pet from used list
      usedChipNumbers.delete(data.microchipId);
      microchipHandler();
    }
    if (data.speciesId) {
      if (data.speciesId === 1) { // Dog
        const speciesDog = document.getElementById('speciesDog');
        speciesDog.checked = true;
        formData.speciesId = '1'; // string for ID 'Dog'
      } else { // Cat
        const speciesCat = document.getElementById('speciesCat');
        speciesCat.checked = true;
        formData.speciesId = '2'; // string for ID 'Cat'
      }
    }
    if (data.pureBreed === true) { // Purebred (true)
      const pureBreedPurebred = document.getElementById('pureBreedPurebred');
      pureBreedPurebred.checked = true;
      formData.purebreed = 'true'; // string
    } else { // Mixed (false)
      const pureBreedMixed = document.getElementById('pureBreedMixed');
      pureBreedMixed.checked = true;
      formData.purebreed = 'false'; // string
    }
    Loader.showLoader();
    await ensureBreedListIsPopulated();
    Loader.hideLoader();
    if (data.breedId) {
      const breedName = getBreedNameForId(data.breedId);
      formData.breed = { breedName, breedId: data.breedId.toString() };
      petBreedInput.value = breedName;
      petBreedHandler();
    }

    // promocode from owner data
    if (data.couponCode) {
      promocodeInput.value = data.couponCode;
      Loader.showLoader();
      await promocodeHandler();
      Loader.hideLoader();
    }
  }
  prefillFormIfPossible();

  // Add event listener
  if (!isSummaryPage()) {
    emailInput.addEventListener('blur', () => {
      emailHandler();
    });

    zipcodeInput.addEventListener('blur', async () => {
      await zipcodeHandler();
    });

    applyPromoCodeButton.addEventListener('click', () => {
      promocodeHandler();
    });

    promocodeInput.addEventListener('input', () => {
      if (promocodeInput.value.trim() === '') {
        hideErrorMessage(promocodeInput, false);
        applyPromoCodeButton.disabled = true;
      } else {
        applyPromoCodeButton.disabled = false;
      }
    });
  }

  petNameInput.addEventListener('blur', () => {
    petNameHandler();
  });

  microchipInput.addEventListener('blur', () => {
    microchipHandler();
  });

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

  document.addEventListener('click', clearResults);

  if (isSummaryPage()) {
    cancelButton.addEventListener('click', () => {
      const formWrapper = document.getElementById('form-wrapper');
      formWrapper.innerHTML = '';
    });

    addPetButton.addEventListener('click', async () => {
      // verify we have all the required fields
      const fieldHandlers = [
        petNameHandler,
        speciesHandler,
        pureBreedHandler,
        petBreedHandler,
        microchipHandler,
      ];
      let allPassed = true;

      for (let i = 0; i < fieldHandlers.length; i += 1) {
        const fieldHandler = fieldHandlers[i];
        // eslint-disable-next-line no-await-in-loop
        if (!await fieldHandler()) {
          allPassed = false;
        }
      }

      if (allPassed) {
        await executeAddPet();
      } else {
        showGeneralErrorMessage('Please ensure all required fields are filled out.');
      }
    });
  } else {
    submitButton.addEventListener('click', async () => {
      // verify we have all the required fields
      const fieldHandlers = [
        petNameHandler,
        emailHandler,
        speciesHandler,
        pureBreedHandler,
        petBreedHandler,
        microchipHandler,
        zipcodeHandler,
        promocodeHandler,
      ];
      let allPassed = true;

      for (let i = 0; i < fieldHandlers.length; i += 1) {
        const fieldHandler = fieldHandlers[i];
        // eslint-disable-next-line no-await-in-loop
        if (!await fieldHandler()) {
          allPassed = false;
        }
      }

      if (allPassed) {
        await executeSubmit();
      } else {
        showGeneralErrorMessage('Please ensure all required fields are filled out.');
      }
    });
  }
}
