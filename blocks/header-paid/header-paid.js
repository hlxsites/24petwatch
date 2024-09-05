import { jsx, changeDomain, addCanadaToLinks } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { isCanada, decorateLinks } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  let baseHeaderUrl = '/fragments/us/header-paid';
  if (isCanada) {
    baseHeaderUrl = '/fragments/ca/header-paid';
  }

  const headerPaidContent = await loadFragment(baseHeaderUrl);

  block.innerHTML = jsx`
    <div class="header-paid wrapper">
      <div id="header-paid"></div>
    </div>`;

  const headerContainer = document.querySelector('#header-paid');
  headerContainer.append(headerPaidContent);

  changeDomain(block);
  addCanadaToLinks(block);
  decorateLinks(block);
}
