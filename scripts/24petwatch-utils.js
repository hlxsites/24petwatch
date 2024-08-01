// ---- the following constants are not expected to change ----
export const PET_PLANS_LPM_URL = '/lps-quote'; // aka 'PET_PLANS_LPS_URL'
export const PET_PLANS_LPM_PLUS_URL = '/lpm-plus';
export const PET_PLANS_ANNUAL_URL = '/annual-quote';
export const PET_PLANS_SUMMARY_QUOTE_URL = '/summary-quote';

export const MICROCHIP_REGEX = /^([A-Z0-9]{15}|[A-Z0-9]{10}|[A-Z0-9]{9})$/i;
export const POSTAL_CODE_CANADA_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// ----- cookie helpers -----
export const COOKIE_NAME_FOR_PET_TAGS = 'ph.PetTagQuote';
export const COOKIE_NAME_FOR_PET_PLANS = 'ph.PetPlanQuote';

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

export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;Secure;SameSite=Strict`;
}
