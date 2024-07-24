// utility for the pet tag quotation process: tag-quote, tag-select, and summary-quote
export const API_BASE_URL = 'https://348665-24petwatch-stage.adobeioruntime.net/api/v1/web/24petwatch-appbuilder/proxy-pethealth-services'; // no trailing slash

export const PRICE_PER_TAG_METAL = 11.95; // ex: 11.95
export const PRICE_PER_TAG_LIFETIME_SMALL = 17.95; // ex: 17.95
export const PRICE_PER_TAG_LIFETIME_LARGE = 19.95; // ex: 19.95

export const ALLOW_ZERO_PAYMENT = false; // ex: if allowing free pricing for tags, then set to: true

// ---- the following constants are not expected to change ----
export const STEP_1_URL = '/tag-quote';
export const STEP_2_URL = '/tag-select';
export const STEP_3_URL = '/summary-quote';

export const POSTAL_CODE_CANADA_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// ----- misc helpers -----
export function asDecimal(value, fractionDigits = 2) {
  return Number(value.toFixed(fractionDigits));
}

// ----- cookie helpers -----
export const COOKIE_NAME = 'ph.PetTagQuote';

const COOKIE_DELIM = '~#|#~';

function getCookie(name, defaultVal = null) {
  const cookieArr = document.cookie.split(';');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < cookieArr.length; i++) {
    const cookiePair = cookieArr[i].split('=');
    if (name === cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return defaultVal; // might be null
}

export function getCombinedCookie(name, defaultVal = []) {
  const cookieValue = getCookie(name, null);
  if (cookieValue) {
    return cookieValue.split(COOKIE_DELIM); // return an array
  }
  return defaultVal; // default: return an empty array
}

export function setCombinedCookie(name, values, days = 1) {
  const value = values.join(COOKIE_DELIM);
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;Secure;SameSite=Strict`;
}

export function deleteCookie(name = COOKIE_NAME) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;Secure;SameSite=Strict`;
}
