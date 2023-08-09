import { getMetadata, decorateIcons } from '../../scripts/lib-franklin.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * decorates the langaugae menu, mainly the nav
 * @param {Element} block The header block element
 */
function decorateLanguage(block,html) {
  if (html.hasChildNodes()) {
    console.log(window.location.pathname);
    const country = window.location.pathname.startsWith('/ca')? 'ca' : 'us';
    const languageNav = document.createElement('div');
    languageNav.classList.add('languagenavigation');
    languageNav.innerHTML = `<div class="cmp-languagenavigation__item--active">
        <span class="cmp-languagenavigation__item-imgWp" data-country="US" data-language="en" data-pagepath="/content/24petwatch/us/en" lang="en-US">
        </span>
        <span class="cmp-languagenavigation__item-arrow"></span>
    </div>
<ul class="cmp-languagenavigation__group">
<li class="cmp-languagenavigation__item cmp-languagenavigation__item--countrycode-CA cmp-languagenavigation__item--langcode-en-CA cmp-languagenavigation__item--level-0">
<a data-cmp-clickable="" class="cmp-languagenavigation__item-link" href="/ca" hreflang="en-CA" rel="alternate" title="Canada">
<ul class="cmp-languagenavigation__group"></ul>
<span class="cmp-languagenavigation__item-title" lang="en-CA">Canada</span>
</a>
</li>
<li class="cmp-languagenavigation__item cmp-languagenavigation__item--countrycode-US cmp-languagenavigation__item--langcode-en-US cmp-languagenavigation__item--level-0 cmp-languagenavigation__item--active hide">
<a data-cmp-clickable="" class="cmp-languagenavigation__item-link" href="/" hreflang="en-US" rel="alternate" title="US">
<ul class="cmp-languagenavigation__group"></ul>
<span class="cmp-languagenavigation__item-title" lang="en-US">US</span>
</a>
</li>
</ul>`;
  block.appendChild(languageNav);
  }
}
/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const tmpdiv = document.createElement('div');
    tmpdiv.innerHTML = html;
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.classList.add('page-header');
    if (tmpdiv.childElementCount > 0) {
      const section = tmpdiv.children[0];
      const pageheadernotificationBar = document.createElement('div');
      pageheadernotificationBar.classList.add('page-header__notificationBar');
      pageheadernotificationBar.classList.add('nav-top');
      pageheadernotificationBar.classList.add('nav-sections');
      const headerContainer = document.createElement('div');
      headerContainer.classList.add('cmp-container');
      decorateLanguage(headerContainer,section.children[0].children[0]);
      section.children[0].removeChild(section.children[0].children[0]);
      pageheadernotificationBar.append(headerContainer);
      headerContainer.append(section);
      nav.append(pageheadernotificationBar);
    }
    if (tmpdiv.childElementCount > 1) {
      const section = tmpdiv.children[0];
      const brandImage = section.querySelector('picture');
      console.log('print picture');
      console.log(brandImage);
      const brandLink = document.createElement('a');
      brandLink.setAttribute('href', '/');
      brandLink.innerHTML = brandImage.innerHTML;
      section.querySelector('ul > li').innerHTML = '';
      section.querySelector('ul > li').appendChild(brandLink);
      const emelement = section.querySelector('em').parentNode;
      emelement.innerHTML = `<div class="page-header__get-quote cmp-button--styleprimary ">
      <a id="button-56f5d74eb3" class="cmp-button" href="/ca/lost-pet-protection/lps-quote" aria-label="Get started" data-cmp-clickable="" data-cmp-data-layer="{&quot;button-56f5d74eb3&quot;:{&quot;@type&quot;:&quot;pethealth/components/button&quot;,&quot;repo:modifyDate&quot;:&quot;2023-05-18T21:16:53Z&quot;,&quot;dc:title&quot;:&quot;Get started&quot;,&quot;xdm:linkURL&quot;:&quot;/content/24petwatch/ca/en/lost-pet-protection/lps-quote.html&quot;}}">
      <span class="cmp-button__text">Get started</span>
      </a>
      </div>`;
      const pageHeaderContainer = document.createElement('div');
      pageHeaderContainer.classList.add('page-header__container');
      pageHeaderContainer.classList.add('nav-bottom');
      pageHeaderContainer.classList.add('nav-sections');
      pageHeaderContainer.classList.add('nav-brand');
      pageHeaderContainer.append(section);
      nav.append(pageHeaderContainer);
    }
    tmpdiv.innerHTML = '';
    tmpdiv.remove();
    /*
    const navBrand = nav.querySelector('.nav-brand');
    const navBrandLink = document.createElement('a');
    navBrandLink.setAttribute('href', '/');
    navBrandLink.setAttribute('aria-label', 'Home');
    navBrandLink.innerHTML = navBrand.innerHTML;
    navBrand.innerHTML = '';
    navBrand.appendChild(navBrandLink);
    */
    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          if (isDesktop.matches) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      });
      // add contactus link
      const contactUs = navSections.querySelector('a[href=""]');
      if (contactUs) {
        contactUs.setAttribute('href', '#contactus-form');
      }
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span class="nav-hamburger-icon"></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isDesktop.matches);
    isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

    decorateIcons(nav);
    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);

    const headers = block.querySelectorAll('ul > li > a');
    const url = new URL(window.location);
    headers.forEach((header) => {
      const headerUrl = new URL(header.href);
      if (url.pathname === headerUrl.pathname && !headerUrl.hash) {
        header.classList.add('active');
      }
    });
  }
}