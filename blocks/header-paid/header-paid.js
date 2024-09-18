import { jsx, changeDomain, addCanadaToLinks } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { isCanada, decorateLinks } from '../../scripts/lib-franklin.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';

/**
 * instruments the tracking in the header
 * @param {Element} header The header block element
 */
function instrumentTrackingEvents(header) {
  header.querySelectorAll('a')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const linkText = (e.target.textContent || '').trim();
        const linkUrl = e.target.href;

        // track Get Started anchor click
        if (linkText === 'Get Started') {
          trackGTMEvent('cta_click', {
            cta_location: 'header_cta',
            link_text: linkText,
            link_url: linkUrl,
          });
        }
      });
    });
}

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
  instrumentTrackingEvents(headerContainer);
}
