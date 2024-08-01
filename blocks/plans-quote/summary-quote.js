import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import APIClient from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_FOR_PET_PLANS,
  PET_PLANS_LPM_URL,
  PET_PLANS_LPM_PLUS_URL,
  PET_PLANS_ANNUAL_URL,
  getCombinedCookie,
} from '../../scripts/24petwatch-utils.js';

export default async function decorateSummaryQuote(block, apiBaseUrl) {
  // add in the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/plans-quote/summary-quote.css';
  document.head.appendChild(link);

  // initialize form based on results from the previous step
  const APIClientObj = new APIClient(apiBaseUrl);
  const [ownerId = '', petId = ''] = getCombinedCookie(COOKIE_NAME_FOR_PET_PLANS, []);

  async function determinePreviousStep(currentPetId) {
    const petData = await APIClientObj.getSelectedProductsForPet(currentPetId);
    if (!petData || petData.length === 0) {
      return PET_PLANS_LPM_URL;
    }
    const plan = petData[0];
    let previousStep = PET_PLANS_LPM_PLUS_URL; // default
    if (plan.itemName.includes(' (LPM)')) {
      previousStep = PET_PLANS_LPM_URL;
    } else if (plan.itemName.includes(' PLUS')) {
      previousStep = PET_PLANS_LPM_PLUS_URL;
    } else if (plan.itemName.includes('Annual')) {
      previousStep = PET_PLANS_ANNUAL_URL;
    }
    return previousStep;
  }

  // determine where we came from
  const previousStep = await determinePreviousStep(petId);

  // create the HTML
  const msg = isCanada ? 'Howdy from Canada!' : 'Howdy from the United States!';
  block.innerHTML = jsx`
    <!-- TODO: flesh -->
    <p>${msg} ... <em>stay tuned!</em></p>
    <ul>
        <li><strong>Owner ID:</strong> &nbsp;     ${ownerId}</li>
        <li><strong>Pet ID:</strong> &nbsp;&nbsp; s${petId}</li>  
    </ul>
    <p>Previous step for this pet: <a href=".${previousStep}">Go back</a></p>
  `;
}
