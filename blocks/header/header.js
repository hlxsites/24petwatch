import {
  getMetadata,
  decorateIcons,
  decorateButtons,
  decorateLinks,
  isMobile,
  isTablet,
  // isDesktop,
  isCanada,
  // isLiveSite,
  // isCrosswalkDomain,
  // getXWalkDomain,
} from '../../scripts/lib-franklin.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';

// let positionY = 0;
// const SCROLL_STEP = 25;

const urls = {
  usa: {
    url: '/',
    name: 'US',
    imageName: 'flagusa',
    icon: 'icon-flagusa',
    lang: 'en-US',
  },
  canada: {
    url: '/ca',
    name: 'Canada',
    imageName: 'flagcanada',
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
  sections.querySelectorAll('#nav > div').forEach((section) => {
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
  toggleAllNavSections(nav, expanded);
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
    newCountryUrl = new URL(`/ca${(window.location.pathname === '/') ? '' : window.location.pathname}`, window.location.origin);
  }

  const languageSelector = document.createElement('li');
  languageSelector.classList.add('language-selector');
  languageSelector.innerHTML = `<span class="icon ${currentCountry.icon}"><img src='/icons/${currentCountry.imageName}.svg' /><span id='country-name'></span></span>
      <ul>
        <li><a href="${newCountryUrl.href}" hreflang="${alternateCountry.lang}" rel="alternate" title="${alternateCountry.name}"><span class="icon ${alternateCountry.icon}"><img src='/icons/${alternateCountry.imageName}.svg' /></span>${alternateCountry.name}</a></li>
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
 * Rewrite links to add Canada to the path
 * @param {Element} header The header block element
 */
function addCanadaToLinks(header) {
  if (isCanada) {
    header.querySelectorAll('a').forEach((anchor) => {
      if (anchor.getAttribute('rel') === 'alternate') return;
      const url = new URL(anchor.href);
      const newUrl = new URL(anchor.href, window.location.origin);
      if (url.hostname === window.location.hostname) {
        // change only for internal links
        newUrl.pathname = `/ca${url.pathname}`;
        anchor.href = newUrl.toString();
      }
    });
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
  let baseHeaderUrl = '/blog/fragments/us/mega-nav';
  if (isCanada) {
    baseHeaderUrl = '/blog/fragments/ca/mega-nav';
  }

  // Note: This is commented out because the header is not being served from the crosswalk domain
  // if (!isLiveSite && !isCrosswalkDomain) {
  //   if (isCanada) {
  //     baseHeaderUrl = `https://${getXWalkDomain()}/fragments/ca/header/master`;
  //   } else {
  //     baseHeaderUrl = `https://${getXWalkDomain()}/fragments/header/master`;
  //   }
  // }

  const navPath = navMeta ? new URL(navMeta).pathname : baseHeaderUrl;
  const resp = await fetch(`${navPath}.plain.html`);

  if (!resp.ok) {
    return;
  }

  const html = await resp.text();

  // decorate nav DOM
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.innerHTML = html;

  const classes = ['brand', 'meganav', 'memberships', 'register', 'secondary'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  addCanadaToLinks(navWrapper);

  // Append membership hover content
  const membershipsHoverContent = nav.querySelector('.nav-memberships');
  navWrapper.append(membershipsHoverContent);

  // Append register hover content
  const registerHoverContent = nav.querySelector('.nav-register');
  navWrapper.append(registerHoverContent);
  decorateLinks(registerHoverContent);

  // Add icon to login links
  const loginLinks = nav.querySelector('.login');
  addExternalLinkIcons(loginLinks);

  decorateIcons(nav);
  decorateButtons(nav);
  decorateLinks(nav);
  instrumentTrackingEvents(nav);
  removeTargetBlank(nav);
  addLinkToLogo(nav);

  // get mega nav elements
  const megaNav = nav.querySelector('.nav-meganav .mega-nav');
  if (megaNav) {
    // add id to each div of mega nav
    megaNav.querySelectorAll('.mega-nav > div').forEach((div, index) => {
      div.id = `meganav-link-${index + 1}`;
    });
  }

  const navMembershipText = nav.querySelector('#meganav-link-1');
  const membershipDiv = navMembershipText.querySelector('div');
  membershipDiv.className = 'before-click';
  const navRegisterText = nav.querySelector('#meganav-link-4');
  const registerDiv = navRegisterText.querySelector('div');
  registerDiv.className = 'before-click';
  const loginDiv = nav.querySelector('.login > div');
  const loginText = nav.querySelector('.login > div > div:first-child');
  const loginHoverContent = nav.querySelector('.login > div > div:last-child');

  // Add click events.
  navMembershipText.addEventListener('click', () => {
    if (membershipsHoverContent.style.display === 'flex') {
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
    } else {
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
      loginText.className = '';
      if (window.innerWidth <= 900) {
        loginText.className = 'before-click';
      }
      loginHoverContent.style.display = 'none';
      membershipsHoverContent.style.display = 'flex';
      membershipDiv.className = 'after-click active';
    }
  });

  navRegisterText.addEventListener('click', () => {
    if (registerHoverContent.style.display === 'flex') {
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
    } else {
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
      loginText.className = '';
      if (window.innerWidth <= 900) {
        loginText.className = 'before-click';
      }
      loginHoverContent.style.display = 'none';
      registerHoverContent.style.display = 'flex';
      registerDiv.className = 'after-click active';
    }
  });

  loginDiv.addEventListener('click', () => {
    if (loginHoverContent.style.display === 'flex') {
      loginHoverContent.style.display = 'none';
      loginText.className = '';
      if (window.innerWidth <= 900) {
        loginText.className = 'before-click';
      }
    } else {
      loginHoverContent.style.display = 'flex';
      loginText.className = 'active';
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
      if (window.innerWidth <= 900) {
        loginText.className = 'after-click active';
      }
    }
  });

  // language selector
  const secondaryMenu = nav.querySelector('.nav-secondary');
  decorateLanguageSelector(secondaryMenu);

  const navBrand = nav.querySelector('.nav-brand');
  const navMega = nav.querySelector('.nav-meganav');
  const languageSelected = nav.querySelector('.language-selector #country-name');
  let countryName = isCanada ? 'Canada' : 'United States';
  if (window.innerWidth <= 900) {
    navBrand.append(nav.querySelector('.button-container'));
    navMembershipText.append(membershipsHoverContent);
    navRegisterText.append(registerHoverContent);
    loginText.className = 'before-click';
    languageSelected.append(countryName);
  }
  // Do this on resize
  window.addEventListener('resize', () => {
    countryName = isCanada ? 'Canada' : 'United States';
    if (window.innerWidth <= 900) {
      navBrand.append(nav.querySelector('.button-container'));
      navMembershipText.append(membershipsHoverContent);
      navRegisterText.append(registerHoverContent);
      loginText.className = 'before-click';
      if (languageSelected.innerHTML === '') {
        languageSelected.innerHTML = countryName;
      }
    } else {
      navMega.append(nav.querySelector('.button-container'));
      navWrapper.append(membershipsHoverContent);
      navWrapper.append(registerHoverContent);
      loginText.classList.remove('before-click');
      loginText.classList.remove('after-click');
      if (languageSelected.innerHTML !== '') {
        languageSelected.innerHTML = '';
      }
    }
  });

  // const navSections = nav.querySelector('.nav-meganav');
  // if (navSections) {
  //   console.log('Inside Nav section', navSections);
  //   navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
  //     if (navSection.querySelector('ul')) {
  //       navSection.classList.add('nav-drop');
  //       const dropdownAnchor = document.createElement('a');
  //       dropdownAnchor.href = '#';
  //       dropdownAnchor.ariaLabel = 'Open dropdown menu';
  //       dropdownAnchor.classList.add('icon-arrow');
  //       dropdownAnchor.addEventListener('click', (e) => {
  //         e.preventDefault();
  //       });
  //       navSection.append(dropdownAnchor);
  //     }
  //     navSection.addEventListener('click', (e) => {
  //       if (!isTablet.matches && !isDesktop.matches && e.target.tagName === 'A') return;

  //       const expanded = navSection.getAttribute('aria-expanded') === 'true';
  //       navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  //     });
  //     navSection.addEventListener('mouseenter', () => {
  //       if (isDesktop.matches) {
  //         navSection.setAttribute('aria-expanded', 'true');
  //       }
  //     });
  //     navSection.addEventListener('mouseleave', () => {
  //       if (isDesktop.matches) {
  //         navSection.setAttribute('aria-expanded', 'false');
  //       }
  //     });
  //   });
  // }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span></span><span></span><span></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, nav));
  navBrand.append(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navMega, isTablet.matches);
  isTablet.addEventListener('change', () => closeAllMenus(nav, nav));

  // Close dropdown content on scroll.
  window.addEventListener('scroll', () => {
    registerHoverContent.style.display = 'none';
    registerDiv.className = 'before-click';
    membershipsHoverContent.style.display = 'none';
    membershipDiv.className = 'before-click';
    loginHoverContent.style.display = 'none';
    loginText.className = '';
    if (window.innerWidth <= 900) {
      loginText.className = 'before-click';
    }
  }, false);

  // Close dropdown content on outside click.
  document.addEventListener('click', (e) => {
    if (!membershipsHoverContent.contains(e.target) && membershipDiv.classList.contains('active') && !navMembershipText.contains(e.target)) {
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
    }
    if (!registerHoverContent.contains(e.target) && registerDiv.classList.contains('active') && !navRegisterText.contains(e.target)) {
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
    }
    if (!loginHoverContent.contains(e.target) && loginText.classList.contains('active') && !loginDiv.contains(e.target)) {
      loginHoverContent.style.display = 'none';
      loginText.className = '';
      if (window.innerWidth <= 900) {
        loginText.className = 'before-click';
      }
    }
  }, false);
}
