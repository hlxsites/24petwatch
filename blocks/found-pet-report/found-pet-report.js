import { jsx, loadScript } from '../../scripts/scripts.js';
import { getConfigValue } from '../../scripts/configs.js';
import { isCanada } from '../../scripts/lib-franklin.js';

async function executeSubmit(block, requestBody) {
  const reportLostEndpoint = await getConfigValue('found-pet-endpoint');
  const form = block.querySelector('#report-lost-found-pet');

  try {
    const response = await fetch(reportLostEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const urlPath = isCanada ? '/ca/lost-pet-protection/report-lost-found-pet/thank-you' : '/lost-pet-protection/report-lost-found-pet/thank-you';
      window.location.href = urlPath;
    } else {
      form.classList.add('submission-message');
      form.innerHTML = 'There was an error with your submission. Please try again.';
    }
  } catch (error) {
    form.classList.add('submission-message');
    form.innerHTML = 'There was an error with your submission. Please try again.';
    // eslint-disable-next-line no-console
    console.error('There was an error with the submission:', error);
  }
}

function validateField(element, regex, message = 'A valid input is required') {
  const trimmedValue = element.value.trim();
  const container = element.parentElement;
  const errorMessage = container.querySelector('.error-message');
  const checkmark = container.querySelector('.checkmark');

  if (trimmedValue !== '') {
    if (!regex.test(trimmedValue)) {
      errorMessage.textContent = message;
      container.classList.add('error');
      checkmark.setAttribute('style', 'opacity: 0;');
      return null; // Return false if the value does not match the regex
    }
    errorMessage.textContent = '';
    container.classList.remove('error');
    checkmark.setAttribute('style', 'opacity: 1;');
  } else {
    errorMessage.textContent = message;
    if (container.classList.contains('error')) {
      container.classList.remove('error');
    }
    checkmark.setAttribute('style', 'opacity: 0;');
    return null;
  }
  return trimmedValue;
}

function showErrorMessage(errorMessage = 'There was a problem with reCAPTCHA validation') {
  const errorElement = document.querySelector('.error-message.general-error-message');
  errorElement.textContent = errorMessage;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = '';
  }, 5000);
}

export default async function decorate(block) {
  const captchaSiteKey = await getConfigValue('captcha-site-key');
  const script = `https://www.google.com/recaptcha/api.js?render=${captchaSiteKey}`;

  const formHTML = jsx`<div>
  <form id="report-lost-found-pet">
    <h2>Pet Information</h2>
    <div class="wrapper">
      <input type="text" id="petName" name="petName" required placeholder="">
      <label for="petName" class="float-label">Pet's name*</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
    </div>
    <div class="wrapper wrapper-info">
      <input type="text" id="microchipId" name="microchipId" required placeholder="" maxlength="15">
      <label for="microchipId" class="float-label">Microchip number (up to 15 digits)*</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
      <div class="info-icon"><div class="info-content">Not sure of your pet's microchip number? Please contact us immediately at 1-833-886-8002.</div></div>
    </div>

    <h2>Contact Information</h2>
    <div class="wrapper">
    <input type="text" id="ownerName" name="ownerName" placeholder="" maxlength="40" required>
    <label for="ownerName" class="float-label">Finder's Name*</label>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>
  <div class="wrapper">
    <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="" maxlength="12">
    <label for="phoneNumber" class="float-label">Phone Number*</label>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>
  <div class="wrapper">
    <input type="email" id="email" name="email" placeholder="" maxlength="40" required>
    <label for="email" class="float-label">Email Address*</label>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>

  <h2>Found Location</h2>
    <div class="wrapper">
    <label for="country">Country*</label>
    <select id="country">
    <option value="--PLACEHOLDER--">Select Country</option>
    <option value="CA">Canada</option>
    <option value="US">United States</option>
    </select>
    <span class="checkmark"></span>
    <div class="error-message"></div>
    </div>
    <div class="wrapper">
    <label for="provinceState">Province/State*</label>
    <select id="provinceState">
    <option value="--PLACEHOLDER--">Select Country First</option>
    </select>
    <span class="checkmark"></span>
    <div class="error-message"></div>
    </div>
    <div class="wrapper">
    <input type="text" id="city" name="city" placeholder="" maxlength="35" required>
    <label for="city" class="float-label">City*</label>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>
  <div class="wrapper">
    <input type="text" id="address" name="address" placeholder="" maxlength="28" required>
    <label for="address" class="float-label">Intersection / Address*</label>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>
  <div class="wrapper">
    <label for="notes">Notes:</label>
    <textarea id="notes" name="notes" placeholder="" maxlength="200" rows="2"></textarea>
    <span class="checkmark"></span>
    <div class="error-message"></div>
  </div>

    <div class="wrapper">
      <button type="button" id="submit">SUBMIT</button>
    </div>
    <div class="error-message general-error-message"></div>
  </form>
  </div>`;

  block.insertAdjacentHTML('afterbegin', formHTML);

  const form = document.querySelector('#report-lost-found-pet');
  const petName = form.querySelector('#petName');
  const microchipId = form.querySelector('#microchipId');
  const ownerName = form.querySelector('#ownerName');
  const phoneNumber = form.querySelector('#phoneNumber');
  const email = form.querySelector('#email');
  const country = form.querySelector('#country');
  const provinceState = form.querySelector('#provinceState');
  const city = form.querySelector('#city');
  const address = form.querySelector('#address');
  const notes = form.querySelector('#notes');
  const submitButton = form.querySelector('#submit');

  // REGEX for validators
  const AT_LEAST_ONE_SYMBOL_REGEX = /.+/;
  const AT_LEAST_ONE_SYMBOL_OR_NUMBER_REGEX = /[0-9\p{P}\p{S}]/u;
  // const PHONE_OPTIONAL_REGEX = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
  const PHONE_OPTIONAL_REGEX = /^\d{3}-?\d{3}-?\d{4}$/;
  const EMAIL_OPTIONAL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const states = {
    CA: [
      { name: 'Alberta', abbreviation: 'AB' },
      { name: 'British Columbia', abbreviation: 'BC' },
      { name: 'Manitoba', abbreviation: 'MB' },
      { name: 'New Brunswick', abbreviation: 'NB' },
      { name: 'Newfoundland and Labrador', abbreviation: 'NL' },
      { name: 'Nova Scotia', abbreviation: 'NS' },
      { name: 'Northwest Territories', abbreviation: 'NT' },
      { name: 'Nunavut', abbreviation: 'NU' },
      { name: 'Ontario', abbreviation: 'ON' },
      { name: 'Prince Edward Island', abbreviation: 'PE' },
      { name: 'Quebec', abbreviation: 'QC' },
      { name: 'Saskatchewan', abbreviation: 'SK' },
      { name: 'Yukon', abbreviation: 'YT' },
    ],
    US: [
      { name: 'Alabama', abbreviation: 'AL' },
      { name: 'Alaska', abbreviation: 'AK' },
      { name: 'American Samoa', abbreviation: 'AS' },
      { name: 'Arizona', abbreviation: 'AZ' },
      { name: 'Arkansas', abbreviation: 'AR' },
      { name: 'California', abbreviation: 'CA' },
      { name: 'Colorado', abbreviation: 'CO' },
      { name: 'Connecticut', abbreviation: 'CT' },
      { name: 'Delaware', abbreviation: 'DE' },
      { name: 'District Of Columbia', abbreviation: 'DC' },
      { name: 'Federated States Of Micronesia', abbreviation: 'FM' },
      { name: 'Florida', abbreviation: 'FL' },
      { name: 'Georgia', abbreviation: 'GA' },
      { name: 'Guam', abbreviation: 'GU' },
      { name: 'Hawaii', abbreviation: 'HI' },
      { name: 'Idaho', abbreviation: 'ID' },
      { name: 'Illinois', abbreviation: 'IL' },
      { name: 'Indiana', abbreviation: 'IN' },
      { name: 'Iowa', abbreviation: 'IA' },
      { name: 'Kansas', abbreviation: 'KS' },
      { name: 'Kentucky', abbreviation: 'KY' },
      { name: 'Louisiana', abbreviation: 'LA' },
      { name: 'Maine', abbreviation: 'ME' },
      { name: 'Marshall Islands', abbreviation: 'MH' },
      { name: 'Maryland', abbreviation: 'MD' },
      { name: 'Massachusetts', abbreviation: 'MA' },
      { name: 'Michigan', abbreviation: 'MI' },
      { name: 'Minnesota', abbreviation: 'MN' },
      { name: 'Mississippi', abbreviation: 'MS' },
      { name: 'Missouri', abbreviation: 'MO' },
      { name: 'Montana', abbreviation: 'MT' },
      { name: 'Nebraska', abbreviation: 'NE' },
      { name: 'Nevada', abbreviation: 'NV' },
      { name: 'New Hampshire', abbreviation: 'NH' },
      { name: 'New Jersey', abbreviation: 'NJ' },
      { name: 'New Mexico', abbreviation: 'NM' },
      { name: 'New York', abbreviation: 'NY' },
      { name: 'North Carolina', abbreviation: 'NC' },
      { name: 'North Dakota', abbreviation: 'ND' },
      { name: 'Northern Mariana Islands', abbreviation: 'MP' },
      { name: 'Ohio', abbreviation: 'OH' },
      { name: 'Oklahoma', abbreviation: 'OK' },
      { name: 'Oregon', abbreviation: 'OR' },
      { name: 'Palau', abbreviation: 'PW' },
      { name: 'Pennsylvania', abbreviation: 'PA' },
      { name: 'Puerto Rico', abbreviation: 'PR' },
      { name: 'Rhode Island', abbreviation: 'RI' },
      { name: 'South Carolina', abbreviation: 'SC' },
      { name: 'South Dakota', abbreviation: 'SD' },
      { name: 'Tennessee', abbreviation: 'TN' },
      { name: 'Texas', abbreviation: 'TX' },
      { name: 'Utah', abbreviation: 'UT' },
      { name: 'Vermont', abbreviation: 'VT' },
      { name: 'Virgin Islands', abbreviation: 'VI' },
      { name: 'Virginia', abbreviation: 'VA' },
      { name: 'Washington', abbreviation: 'WA' },
      { name: 'West Virginia', abbreviation: 'WV' },
      { name: 'Wisconsin', abbreviation: 'WI' },
      { name: 'Wyoming', abbreviation: 'WY' },
    ],
  };

  country.addEventListener('change', (e) => {
    provinceState.innerHTML = '';
    const selectedCountry = e.target.value;
    const countryStates = states[selectedCountry];

    if (countryStates) {
      const defaultOption = document.createElement('option');
      defaultOption.text = selectedCountry === 'Canada' ? 'Select Province' : 'Select State';
      defaultOption.disabled = true;
      defaultOption.selected = true;
      provinceState.appendChild(defaultOption);

      countryStates.forEach((state) => {
        const option = document.createElement('option');
        option.value = state.abbreviation;
        option.text = state.name;
        provinceState.appendChild(option);
      });
    }
  });

  petName.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  microchipId.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  ownerName.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  phoneNumber.addEventListener('blur', (event) => {
    validateField(event.target, PHONE_OPTIONAL_REGEX, 'This value seems to be invalid');
  });
  email.addEventListener('blur', (event) => {
    validateField(event.target, EMAIL_OPTIONAL_REGEX, 'This value should be a valid email');
  });
  country.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  provinceState.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  city.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  address.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
  });
  notes.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'A valid input is required');
  });

  function loadReCaptcha(event) {
    // Check if the event target is a descendant of the form
    if (form.contains(event.target)) {
      loadScript(script, { defer: true });

      // Remove the event listener to ensure captcha is loaded only once
      form.removeEventListener('focus', loadReCaptcha, true);
    }
  }

  // Assuming 'form' is already defined as shown in your active selection
  form.addEventListener('focus', loadReCaptcha, true);

  submitButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const petNameValue = validateField(petName, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const microchipIdValue = validateField(microchipId, AT_LEAST_ONE_SYMBOL_OR_NUMBER_REGEX, 'This value is required.');
    const ownerNameValue = validateField(ownerName, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const phoneNumberValue = validateField(phoneNumber, PHONE_OPTIONAL_REGEX, 'This value seems to be invalid');
    const emailValue = validateField(email, EMAIL_OPTIONAL_REGEX, 'This value should be a valid email');
    const countryValue = validateField(country, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const provinceStateValue = validateField(provinceState, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const cityValue = validateField(city, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const addressValue = validateField(address, AT_LEAST_ONE_SYMBOL_REGEX, 'This value is required.');
    const notesValue = validateField(notes, AT_LEAST_ONE_SYMBOL_REGEX, 'A valid input is required');

    const fieldValues = [
      petNameValue,
      microchipIdValue,
      ownerNameValue,
      phoneNumberValue,
      emailValue,
      countryValue,
      provinceStateValue,
      cityValue,
      addressValue,
      notesValue,
    ];

    if (fieldValues.every((value) => value !== null)) {
      const requestBody = {
        chipNumber: microchipIdValue,
        petName: petNameValue,
        reportDate: new Date().toISOString(),
        street: addressValue,
        city: cityValue,
        state: provinceStateValue,
        country: countryValue,
        reporterName: ownerNameValue,
        reporterPhone: phoneNumberValue,
        reporterEmail: emailValue,
        notes: notesValue,
        partnerID: 84,
        isFound: true,
        // Not required fields
        reportSystemName: '24petwatch.com',
        reporterPhoneAlt: '',
        recoveryCaseId: '',
        reportedBy: 1,
        contactConsent: true,
        reporterIp: '',
        resolution: 0,
        internalViewOnly: false,
        enterbyOrgnizationId: '',
        enterByUserName: 'None',
      };

      /* global grecaptcha */
      grecaptcha.ready(() => {
        grecaptcha.execute(captchaSiteKey, { action: 'submit' })
          .then((token) => {
            requestBody.token = token;
            executeSubmit(block, requestBody);
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.error('There was a problem with reCAPTCHA validation:', error);
            showErrorMessage('There was a problem with reCAPTCHA validation');
          });
      });
    } else {
      showErrorMessage('Please correct the errors in the form');
    }
  });
}
