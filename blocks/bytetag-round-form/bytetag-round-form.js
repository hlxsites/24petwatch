import { jsx, loadScript } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const currentScriptFolderUrl = new URL('.', import.meta.url).href;
  const bytetagRoundFeatures = await loadFragment('/lost-pet-protection/bytetag-round-features');

  block.innerHTML = jsx`
    <div class="bytetag-forms">
      <div class="bytetag-columns">
            <div class="shopify-product">
              <div id="product-component-1706803973565"></div>
            </div>
            <div id="bytetag-round-fragment"></div>
      </div>
    </div>
  `;

  const RoundFeaturesFragment = document.querySelector('#bytetag-round-fragment');
  RoundFeaturesFragment.append(bytetagRoundFeatures);

  loadScript(`${currentScriptFolderUrl}shopify-bytetag-round.js`);
}
