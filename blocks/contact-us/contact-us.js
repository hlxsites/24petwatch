import { loadScript } from '../../scripts/scripts.js';

async function executeSubmit(block, requestBody) {
  // Alternatively configuration can be loaded from configs.xlsx in sharepoint | Example:
  // import { getConfigValue } from '../../scripts/configs.js';
  // const contactUsEndpoint = await getConfigValue('contactus-endpoint');
  const form = block.querySelector('.contact-us form');
  // TODO: Update the endpoint to the final one, owned by a customer.
  const contactUsEndpoint = 'https://348665-24petwatch-stage.adobeioruntime.net/api/v1/web/24petwatch-appbuilder/contact-form'; // Local server endpoint

  try {
    const response = await fetch(contactUsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      form.classList.add('submission-message');
      form.innerHTML = `
    Thank you for your inquiry.
    Our representatives are working hard to get back to you as soon as possible.`;
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
  // Alternatively configuration can be loaded from configs.xlsx in sharepoint | Example:
  // const captchaSiteKey = await getConfigValue('captcha-site-key');
  // TODO: Update the captchaSiteKey to the final one, owned by a customer.
  const captchaSiteKey = '6LeZb8cpAAAAAIvHMYMqpINijClS33ccPPqCEyqL';
  const script = `https://www.google.com/recaptcha/api.js?render=${captchaSiteKey}`;

  block.innerHTML = '';
  const formContent = `
  <form id="contact-us">
    <div class="wrapper">
    <label for="purpose">Purpose of inquiry*</label>
    <select id="purpose">
    <option value="item0">Microchip &amp; Membership</option>
    <option value="item1">Lost or Found Pet</option>
    <option value="item2">Existing Insurance Policy Inquiries</option>
    <option value="item3">Claims Inquiries</option>
    <option value="item4">Other</option>
    </select>
    <div class="error-message"></div>
    </div>
    <div class="wrapper">
      <input type="email" id="email" name="email" required placeholder="">
      <label for="email" class="float-label">Enter your email address*</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
    </div>
    <div class="wrapper">
      <textarea id="textarea" required="" placeholder=""></textarea>
      <label for="textarea" class="float-label">How can we help you?*</label>
      <span class="checkmark"></span>
      <div class="error-message"></div>
    </div>
    <div class="wrapper wrapper-text-center">
      <button type="button" id="submit" class="teal">SUBMIT</button>
    </div>
    <div class="error-message general-error-message"></div>
  </form>`;

  const fragment = document.createRange().createContextualFragment(formContent);
  block.appendChild(fragment);

  const form = document.querySelector('.contact-us form');
  const purpose = form.querySelector('#purpose');
  const email = form.querySelector('#email');
  const textarea = form.querySelector('#textarea');
  const submit = form.querySelector('#submit');
  // REGEX for validators
  const AT_LEAST_ONE_SYMBOL_REGEX = /.+/;
  const EMAIL_OPTIONAL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  email.addEventListener('blur', (event) => {
    validateField(event.target, EMAIL_OPTIONAL_REGEX, 'A valid email is required');
  });
  textarea.addEventListener('blur', (event) => {
    validateField(event.target, AT_LEAST_ONE_SYMBOL_REGEX, 'A valid input is required');
  });

  function loadReCaptcha() {
    loadScript(script, { defer: true });

    purpose.removeEventListener('focus', loadReCaptcha);
    email.removeEventListener('focus', loadReCaptcha);
    textarea.removeEventListener('focus', loadReCaptcha);
    submit.removeEventListener('click', loadReCaptcha);
  }

  submit.addEventListener('click', loadReCaptcha, false);
  purpose.addEventListener('focus', loadReCaptcha, false);
  email.addEventListener('focus', loadReCaptcha, false);
  textarea.addEventListener('focus', loadReCaptcha, false);

  submit.addEventListener('click', async (e) => {
    e.preventDefault();

    const emailValue = validateField(email, EMAIL_OPTIONAL_REGEX, 'A valid email is required');
    const textareaValue = validateField(textarea, AT_LEAST_ONE_SYMBOL_REGEX, 'Please enter a message.');
    const purposeValue = purpose.value;

    if (emailValue !== null && textareaValue !== null && purposeValue !== null) {
      const requestBody = {
        email: emailValue,
        text: textareaValue,
        topic: purposeValue,
      };

      /* global grecaptcha */
      grecaptcha.ready(() => {
        grecaptcha.execute(captchaSiteKey, { action: 'submit' })
          .then((token) => {
            requestBody.captchaToken = token;
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
