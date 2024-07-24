import { jsx } from '../../scripts/scripts.js';
import APIClient from '../../scripts/24petwatch-api.js';
import { isCanada } from '../../scripts/lib-franklin.js';

function decorateLeftBlock(block) {
  block.children[0].children[0].innerHTML += jsx`
    <h2>Let's start by getting to know your pet.</h2>
    <p><i>*All fields are required.</i></p>
    <form id="pet-info">
      <div class="wrapper">
        <input type="text" id="petName" name="petName" placeholder="" maxlength="12" required>
        <label for="petName" class="float-label">Firstly, what's their name?*</label>
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
      </div>
      <div class="wrapper">
        <input type="text" id="petBreed" name="petBreed" placeholder="Start Typing..." autocomplete="off" required>
        <label for="petBreed" class="float-label">What's your pet's breed?*</label>
        <div id="petBreedList"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="microchipNumber" name="microchipNumber" placeholder="" required>
        <label for="microchipNumber" class="float-label">We'll need your pet's microchip number*</label>
      </div>
      <div class="wrapper">
        <input type="email" id="email" name="email" placeholder="" maxlength="40" required>
        <label for="email" class="float-label">Email*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper">
        <input type="text" id="zipcode" name="zipcode" placeholder="" required>
        <label for="zipcode" class="float-label">Zip code*</label>
        <span class="checkmark"></span>
        <div class="error-message"></div>
      </div>
      <div class="wrapper promocode-wrapper">
        <input type="text" id="promocode" name="promocode" placeholder="">
        <label for="promocode" class="float-label">Your Promo Code (optional)</label>
        <span class="checkmark"></span>
        <button type="button" id="applyPromoCode" class="secondary" disabled>Apply</button>
        <div class="error-message"></div>
      </div>
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

  const countryId = isCanada ? 1 : 2;
  const APIClientObj = new APIClient();
  const formData = {};
  const breedLists = {};
  const speciesAndPureBreedRadioGroups = document.querySelectorAll('input[type="radio"][name="speciesId"], input[type="radio"][name="purebreed"]');
  const petBreedInput = document.getElementById('petBreed');
  const resultsList = document.getElementById('petBreedList');
  const zipcodeInput = document.getElementById('zipcode');
  const promocodeInput = document.getElementById('promocode');
  const applyPromoCodeButton = document.getElementById('applyPromoCode');

  function showLoader() {
    loaderWrapper.classList.remove('hide');
  }
  function hideLoader() {
    loaderWrapper.classList.add('hide');
  }

  zipcodeInput.addEventListener('blur', () => {
    const zipCode = zipcodeInput.value.trim();
    const container = zipcodeInput.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');

    if (zipCode === '') {
      errorMessage.textContent = 'Please enter a valid zip code';
      checkmark.setAttribute('style', 'opacity: 0;');
      container.classList.add('error');
    } else {
      showLoader();
      APIClientObj.getCountryStates(zipCode, (data) => {
        if (data.zipCode) {
          errorMessage.textContent = '';
          checkmark.setAttribute('style', 'opacity: 1;');
          container.classList.remove('error');
          formData.zipCode = data.zipCode;
        } else {
          errorMessage.textContent = 'Please enter a valid zip code';
          checkmark.setAttribute('style', 'opacity: 0;');
          container.classList.add('error');
          zipcodeInput.value = '';
          formData.zipCode = '';
        }
        hideLoader();
      }, (status) => {
        if (status === 404) {
          errorMessage.textContent = 'Please enter a valid zip code';
          checkmark.setAttribute('style', 'opacity: 0;');
          container.classList.add('error');
          zipcodeInput.value = '';
          formData.zipCode = '';
        } else {
          console.log('Failed with status:', status);
        }
        hideLoader();
      });
    }
  });

  applyPromoCodeButton.addEventListener('click', () => {
    const promoCode = promocodeInput.value.trim();
    const container = promocodeInput.parentElement;
    const errorMessage = container.querySelector('.error-message');
    const checkmark = container.querySelector('.checkmark');

    showLoader();
    APIClientObj.validateNonInsurancePromoCodeWithSpecies(
      promoCode,
      countryId,
      formData.speciesId ?? null,
      (data) => {
        if (data.isValid === true) {
          errorMessage.textContent = '';
          checkmark.setAttribute('style', 'opacity: 1;');
          container.classList.remove('error');
          formData.promoCode = promoCode;
        } else {
          errorMessage.textContent = 'Oops, looks like the promo code is invalid.';
          checkmark.setAttribute('style', 'opacity: 0;');
          container.classList.add('error');
          formData.promoCode = '';
        }
        hideLoader();
      },
      (status) => {
        console.log('Failed with status:', status);
        errorMessage.textContent = '';
        checkmark.setAttribute('style', 'opacity: 0;');
        container.classList.remove('error');
        formData.promoCode = '';
        hideLoader();
      },
    );
  });

  promocodeInput.addEventListener('input', () => {
    if (promocodeInput.value.trim() === '') {
      const container = promocodeInput.parentElement;
      const errorMessage = container.querySelector('.error-message');
      const checkmark = container.querySelector('.checkmark');
      errorMessage.textContent = '';
      checkmark.setAttribute('style', 'opacity: 0;');
      container.classList.remove('error');
      applyPromoCodeButton.disabled = true;
    } else {
      applyPromoCodeButton.disabled = false;
    }
  });

  function onRadioChange(event) {
    formData[event.target.name] = event.target.value;

    if (formData.speciesId && formData.purebreed
      && !breedLists[formData.speciesId + formData.purebreed]) {
      APIClientObj.getBreeds(formData.speciesId, formData.purebreed, (data) => {
        breedLists[formData.speciesId + formData.purebreed] = data;
      }, (status) => {
        console.log('Failed with status:', status);
      });
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
  }

  resultsList.addEventListener('click', (event) => {
    const liElement = event.target.closest('li');
    if (liElement) {
      const breedId = liElement.getAttribute('data-breed-id');
      const breedName = liElement.getAttribute('data-breed-name');
      formData.breed = { breedId, breedName };
      petBreedInput.value = breedName;
      clearResults();
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
  decorateLeftBlock(block);
  decorateRightBlock(block);
}
