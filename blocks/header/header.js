import {
  getMetadata,
  decorateIcons,
  decorateButtons,
  decorateLinks,
  isMobile,
  isTablet,
  isDesktop,
  isCanada,
  isLiveSite,
  isCrosswalkDomain,
  getXWalkDomain,
} from '../../scripts/lib-franklin.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';

let positionY = 0;
const SCROLL_STEP = 25;

const urls = {
  usa: {
    url: '/',
    name: 'US',
    icon: 'icon-flagusa',
    lang: 'en-US',
  },
  canada: {
    url: '/ca',
    name: 'Canada',
    icon: 'icon-flagcanada',
    lang: 'en-CA',
  },
};

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isTablet.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isTablet.matches) {
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

function closeAllMenus(nav, navSections) {
  const wrapper = nav.closest('.nav-wrapper');
  nav.setAttribute('aria-expanded', 'false');
  wrapper?.setAttribute('aria-expanded', 'false');
  wrapper?.querySelector('.nav-secondary')?.querySelector('.language-selector')?.setAttribute('aria-expanded', 'false');
  toggleAllNavSections(navSections, 'false');
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} closeAll Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, closeAll = null) {
  const expanded = closeAll !== null ? !closeAll : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const wrapper = nav.closest('.nav-wrapper');

  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  wrapper?.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded);
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isTablet.matches) {
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
  if (!expanded || isTablet.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > a');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  const homePlaceholder = 'Home';
  crumbs.unshift({ title: homePlaceholder, url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

function decorateLanguageSelector(block) {
  let currentCountry = urls.usa;
  let alternateCountry = urls.canada;
  let newCountryUrl;
  if (isCanada) {
    currentCountry = urls.canada;
    alternateCountry = urls.usa;
  }

  if (isCanada) {
    newCountryUrl = new URL(window.location.pathname.replace('/ca', ''), window.location.origin);
  } else {
    newCountryUrl = new URL(`/ca${window.location.pathname}`, window.location.origin);
  }

  const languageSelector = document.createElement('li');
  languageSelector.classList.add('language-selector');
  languageSelector.innerHTML = `<span class="icon ${currentCountry.icon}"></span>
      <ul>
        <li><a href="${newCountryUrl.toString()}" hreflang="${alternateCountry.lang}" rel="alternate" title="${alternateCountry.name}"><span class="icon ${alternateCountry.icon}"></span>${alternateCountry.name}</a></li>
      </ul>`;

  const secondaryMenu = block.querySelector(':scope > ul');
  if (!secondaryMenu) {
    const li = document.createElement('ul');
    block.append(li);
  }
  block.querySelector(':scope > ul').prepend(languageSelector);

  languageSelector.setAttribute('aria-expanded', 'false');
  languageSelector.addEventListener('click', () => {
    if (!isTablet.matches) {
      const expanded = languageSelector.getAttribute('aria-expanded') === 'true';
      languageSelector.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    }
  });
  languageSelector.addEventListener('mouseenter', () => {
    if (isTablet.matches) {
      languageSelector.setAttribute('aria-expanded', 'true');
    }
  });
  languageSelector.addEventListener('mouseleave', () => {
    if (isTablet.matches) {
      languageSelector.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * instruments the tracking in the header
 * @param {Element} header The header block element
 */
function instrumentTrackingEvents(header) {
  header.querySelectorAll('a')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const menuLocation = isMobile.matches ? 'mobile' : 'header';
        const linkText = (e.target.textContent || '').trim();
        const linkUrl = e.target.href;
        const title = (e.target.title || '').trim();

        // track navigation events
        trackGTMEvent('navigation', {
          menu_location: menuLocation,
          link_text: linkText,
          link_url: linkUrl,
        });

        // track cta clicks on header
        if (e.target.classList.contains('button')) {
          trackGTMEvent('cta_click', {
            link_text: linkText,
            link_url: linkUrl,
          });
        }

        // track report lost and found pet
        if (title === 'Report a Lost or Found Pet') {
          trackGTMEvent('pet_lost_found_report_click');
        }
      });
    });
}

/**
 * Removes target blank from local links
 * @param {Element} header The header block element
 */
function removeTargetBlank(header) {
  header.querySelectorAll('a[target="_blank"]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href);
      if (url.hostname === window.location.hostname) {
        anchor.removeAttribute('target');
      }
    } catch (e) {
      // do nothing
    }
  });
}

/**
 * Adds a link to the logo
 * @param {Element} header The header block element
 */
function addLinkToLogo(header) {
  const logo = header.querySelector('.icon-logo');
  if (logo) {
    const homeURL = isCanada ? urls.canada.url : urls.usa.url;
    logo.innerHTML = `<a href="${homeURL}" title="24PetWatch">${logo.innerHTML}</a>`;
  }
}

/**
 * Adds external link icons to links
 * @param {Element} header
 */
function addExternalLinkIcons(header) {
  header.querySelectorAll('a').forEach((anchor) => {
    const url = new URL(anchor.href);
    if (url.hostname !== window.location.hostname) {
      anchor.classList.add('icon-external');
    }
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  block.textContent = '';
  let baseHeaderUrl = '/fragments/header/master';
  if (isCanada) {
    baseHeaderUrl = '/fragments/ca/header/master';
  }

  if (!isLiveSite && !isCrosswalkDomain) {
    if (isCanada) {
      baseHeaderUrl = `https://${getXWalkDomain()}/fragments/ca/header/master`;
    } else {
      baseHeaderUrl = `https://${getXWalkDomain()}/fragments/header/master`;
    }
  }

  const navPath = navMeta ? new URL(navMeta).pathname : baseHeaderUrl;
  const resp = await fetch(`${navPath}.plain.html`);

  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'nav';
    nav.innerHTML = html;

    const classes = ['brand', 'get-quote', 'sections', 'secondary'];
    classes.forEach((c, i) => {
      const section = nav.children[i];
      if (section) section.classList.add(`nav-${c}`);
    });

    const navSections = nav.querySelector('.nav-sections');
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) {
          navSection.classList.add('nav-drop');
          const dropdownAnchor = document.createElement('a');
          dropdownAnchor.href = '#';
          dropdownAnchor.ariaLabel = 'Open dropdown menu';
          dropdownAnchor.classList.add('icon-arrow');
          dropdownAnchor.addEventListener('click', (e) => {
            e.preventDefault();
          });
          navSection.append(dropdownAnchor);
        }
        navSection.addEventListener('click', (e) => {
          if (!isTablet.matches && !isDesktop.matches && e.target.tagName === 'A') return;

          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
        navSection.addEventListener('mouseenter', () => {
          if (isDesktop.matches) {
            navSection.setAttribute('aria-expanded', 'true');
          }
        });
        navSection.addEventListener('mouseleave', () => {
          if (isDesktop.matches) {
            navSection.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
        <span></span><span></span><span></span>
      </button>`;
    hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    // prevent mobile nav behavior on window resize
    toggleMenu(nav, navSections, isTablet.matches);
    isTablet.addEventListener('change', () => closeAllMenus(nav, navSections));

    // language selector
    const secondaryMenu = nav.querySelector('.nav-secondary');
    decorateLanguageSelector(secondaryMenu);

    decorateIcons(nav);
    decorateButtons(nav);
    decorateLinks(nav);
    instrumentTrackingEvents(nav);
    removeTargetBlank(nav);
    addLinkToLogo(nav);
    addExternalLinkIcons(nav);

    const navWrapper = document.createElement('div');
    navWrapper.className = 'nav-wrapper';
    navWrapper.append(nav);
    block.append(navWrapper);

    if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
      navWrapper.append(await buildBreadcrumbs());
    }

    window.addEventListener('scroll', () => {
      if (window.pageYOffset - positionY > SCROLL_STEP && !navWrapper.classList.contains('slide-up')) {
        navWrapper.classList.remove('slide-down');
        navWrapper.classList.add('slide-up');
      }
      if (positionY - window.pageYOffset > SCROLL_STEP && !navWrapper.classList.contains('slide-down')) {
        navWrapper.classList.remove('slide-up');
        navWrapper.classList.add('slide-down');
      }

      positionY = window.pageYOffset;
    }, false);
  }
}
