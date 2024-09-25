import { getAPIBaseUrl } from '../../scripts/24petwatch-api.js';
import {
  PET_PLANS_SUMMARY_QUOTE_URL,
} from '../../scripts/24petwatch-utils.js';
import decorateSummaryQuote from './summary-quote.js';
import { decorateLeftBlock, decorateRightBlock } from './first-page.js';

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
