import { jsx, changeDomain, addCanadaToLinks } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';
import { isCanada, decorateLinks } from '../../scripts/lib-franklin.js';

// Adding animation for header
function onDomContentLoaded() {
  const header = document.querySelector('header');
  let lastScrollTop = 0;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
      // Scrolling down
      header.classList.remove('slide-down');
      header.classList.add('animated', 'slide-up');
    } else {
      // Scrolling up
      header.classList.remove('slide-up');
      header.classList.add('animated', 'slide-down');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomContentLoaded);
  } else {
    // DOM is already loaded
    onDomContentLoaded();
  }

  changeDomain(block);
  addCanadaToLinks(block);
  decorateLinks(block);
}
