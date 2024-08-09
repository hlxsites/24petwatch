// utility for the pet tag quotation process: tag-quote, tag-select, and summary-quote

export const PRICE_PER_TAG_METAL = 19.95; // ex: 11.95
export const PRICE_PER_TAG_LIFETIME_SMALL = 19.95; // ex: 17.95
export const PRICE_PER_TAG_LIFETIME_LARGE = 19.95; // ex: 19.95

export const ALLOW_ZERO_PAYMENT = false; // ex: if allowing free pricing for tags, then set to: true

// ---- the following constants are not expected to change ----
export const STEP_1_URL = '/tag-quote';
export const STEP_2_URL = '/tag-select';
export const STEP_3_URL = '/summary-quote'; // technically, this is "Step 2.5"

// ----- misc helpers -----
export function asDecimal(value, fractionDigits = 2) {
  return Number(value.toFixed(fractionDigits));
}
