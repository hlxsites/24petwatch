import { jsx, loadScript } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const currentScriptFolderUrl = new URL('.', import.meta.url).href;
  const bytetagSlideFeatures = await loadFragment('/drafts/iakobchu/lost-pet-protection/bytetag-slide-features');

  block.innerHTML = jsx`
    <div class="bytetag-forms">
      <div class="bytetag-columns">
            <div class="shopify-product">
              <div id="product-component-1706028430936"></div>
            </div>
            <div id="bytetag-slide-fragment"></div>
      </div>
    </div>
  `;

  const SlideFeaturesFragment = document.querySelector('#bytetag-slide-fragment');
  SlideFeaturesFragment.append(bytetagSlideFeatures);

  loadScript(`${currentScriptFolderUrl}shopify-bytetag-slide.js`);
}
