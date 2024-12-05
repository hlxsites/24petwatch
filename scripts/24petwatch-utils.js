import { loadFragment } from '../blocks/fragment/fragment.js';

// ---- the following constants are not expected to change ----
export const PET_PLANS_LPM_URL = '/lps-quote'; // aka 'PET_PLANS_LPS_URL'
export const PET_PLANS_LPM_PLUS_URL = '/lpm-plus';
export const PET_PLANS_ANNUAL_URL = '/annual-quote';
export const PET_PLANS_SUMMARY_QUOTE_URL = '/summary-quote';

export const MICROCHIP_REGEX = /^([A-Z0-9]{15}|[A-Z0-9]{10}|[A-Z0-9]{9})$/i;
export const POSTAL_CODE_CANADA_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const CURRENCY_CANADA = 'CAD';
export const CURRENCY_US = 'USD';

// ----- general helpers -----
export function getQueryParam(param, defaultValue = null) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has(param) ? urlParams.get(param) : defaultValue;
}

export function hasQueryParam(param, defaultValue = false) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has(param) && urlParams.get(param).trim() !== '' ? true : defaultValue;
}

// ----- dataLayer event helpers -----
export const DL_EVENTS = {
  add: 'add_to_cart',
  remove: 'remove_from_cart',
  view: 'view_cart',
  checkout: 'begin_checkout',
  purchase: 'purchase',
};

// ----- sessionStorage / localStorage helpers -----
export const SS_KEY_FORM_ENTRY_URL = 'formEntryURL';
export const SS_KEY_SUMMARY_ACTION = 'summaryAction';
export const LS_KEY_COSTCO_FIGO = 'costcoFigoPromo';

// ----- cookie helpers -----
export const COOKIE_NAME_FOR_PET_TAGS = 'ph.PetTagQuote';
export const COOKIE_NAME_FOR_PET_PLANS = 'ph.PetPlanQuote';
export const COOKIE_NAME_SAVED_OWNER_ID = 'ph.savedOwnerId';

const COOKIE_DELIM = '~#|#~';

export function getCookie(name, defaultVal = null) {
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

export function setCookie(name, value, days = 1) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;Secure;SameSite=Strict`;
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
  setCookie(name, value, days);
}

export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;Secure;SameSite=Strict`;
}

export function isSummaryPage() {
  return window.location.pathname.endsWith(PET_PLANS_SUMMARY_QUOTE_URL);
}

export function getSelectedProductAdditionalInfo(itemId) {
  const additionalInfo = {
    PHL_000006: {
      name: 'Lifetime Protection Membership™',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_URL,
      fragmentLink: '/ca/lost-pet-protection/fragments/lpm-info',
    },
    PLH_000007: {
      name: 'Lifetime Protection Membership™',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_URL,
      fragmentLink: '/lost-pet-protection/fragments/lpm-info',
    },
    'LPM-PLUS-US-CATS': {
      name: 'Lifetime Protection Membership™ Plus',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_PLUS_URL,
      fragmentLink: '/lost-pet-protection/fragments/lpm-plus-info',
    },
    'LPM-PLUS-CA-CATS': {
      name: 'Lifetime Protection Membership™ Plus',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_PLUS_URL,
      fragmentLink: '/ca/lost-pet-protection/fragments/lpm-plus-info',
    },
    'LPM-PLUS': {
      name: 'Lifetime Protection Membership™ Plus',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_PLUS_URL,
      fragmentLink: '/lost-pet-protection/fragments/lpm-plus-info',
    },
    'LPM-PLUS-CA': {
      name: 'Lifetime Protection Membership™ Plus',
      priceComment: '(A one-time fee)',
      pageLink: PET_PLANS_LPM_PLUS_URL,
      fragmentLink: '/ca/lost-pet-protection/fragments/lpm-plus-info',
    },
    'Annual Plan-DOGS': {
      name: 'Annual Protection Membership',
      priceComment: 'for the first year $19.95/year thereafter',
      priceCommentPromo: 'for the first year $0/year thereafter',
      pageLink: PET_PLANS_ANNUAL_URL,
      fragmentLink: '/lost-pet-protection/fragments/annual-info',
    },
    'Annual Plan-CATS': {
      name: 'Annual Protection Membership',
      priceComment: 'for the first year $19.95/year thereafter',
      priceCommentPromo: 'for the first year $0/year thereafter',
      pageLink: PET_PLANS_ANNUAL_URL,
      fragmentLink: '/lost-pet-protection/fragments/annual-info',
    },
  };

  return additionalInfo[itemId] || '';
}

export async function getItemInfoFragment(itemId) {
  let fragment = '';
  try {
    fragment = await loadFragment(getSelectedProductAdditionalInfo(itemId).fragmentLink, false);
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to load the fragment for item:', itemId, ' status:', status);
  }

  return fragment;
}
