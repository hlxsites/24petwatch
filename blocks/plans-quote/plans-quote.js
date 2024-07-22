import { jsx } from '../../scripts/scripts.js';
import APIClient from '../../scripts/24petwatch-api.js';

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
    </form>
  `;

  const APIClientObj = new APIClient();
  const pet = {};
  const breedLists = {};
  const speciesAndPureBreedRadioGroups = document.querySelectorAll('input[type="radio"][name="speciesId"], input[type="radio"][name="purebreed"]');
  const petBreedInput = document.getElementById('petBreed');
  const resultsList = document.getElementById('petBreedList');

  function onRadioChange(event) {
    pet[event.target.name] = event.target.value;

    if (pet.speciesId && pet.purebreed && !breedLists[pet.speciesId + pet.purebreed]) {
      APIClientObj.getBreeds(pet.speciesId, pet.purebreed, (data) => {
        breedLists[pet.speciesId + pet.purebreed] = data;
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

    if (query.length >= 2 && breedLists[pet.speciesId + pet.purebreed]) {
      const results = breedLists[pet.speciesId + pet.purebreed]
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
    if (!pet.breed || !pet.breed.breedName) {
      event.target.value = '';
    }
    if (pet.breed && pet.breed.breedName && pet.breed.breedName !== event.target.value) {
      pet.breed = {};
      event.target.value = '';
    }
  }

  resultsList.addEventListener('click', (event) => {
    const liElement = event.target.closest('li');
    if (liElement) { // Assuming you want to listen for clicks on <li> elements
      const breedId = liElement.getAttribute('data-breed-id');
      const breedName = liElement.getAttribute('data-breed-name');
      pet.breed = { breedId, breedName };
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
