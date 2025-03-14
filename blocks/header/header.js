import {
  getMetadata,
  decorateIcons,
  decorateButtons,
  decorateLinks,
  isMobile,
  isDesktopLG,
  isCanada,
  // isLiveSite,
  // isCrosswalkDomain,
  // getXWalkDomain,
  baseDomain,
} from '../../scripts/lib-franklin.js';
import { trackGTMEvent } from '../../scripts/lib-analytics.js';
import { changeDomain, addCanadaToLinks, buildPromoBanner } from '../../scripts/scripts.js';

// let positionY = 0;
// const SCROLL_STEP = 25;

const urls = {
  usa: {
    url: '/',
    name: 'United States',
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
    const navSections = nav.querySelector('.nav-meganav');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktopLG.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktopLG.matches) {
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
    toggleAllNavSections(focused.closest('.nav-meganav'));
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
  if (isDesktopLG.matches) {
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
  if (!expanded || isDesktopLG.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

// function getDirectTextContent(menuItem) {
//   const menuLink = menuItem.querySelector(':scope > a');
//   if (menuLink) {
//     return menuLink.textContent.trim();
//   }
//   return Array.from(menuItem.childNodes)
//     .filter((n) => n.nodeType === Node.TEXT_NODE)
//     .map((n) => n.textContent)
//     .join(' ');
// }

// async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
//   const crumbs = [];

//   const homeUrl = document.querySelector('.nav-brand a').href;

//   let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
//   if (menuItem) {
//     do {
//       const link = menuItem.querySelector(':scope > a');
//       crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
//       menuItem = menuItem.closest('ul')?.closest('li');
//     } while (menuItem);
//   } else if (currentUrl !== homeUrl) {
//     crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
//   }

//   const homePlaceholder = 'Home';
//   crumbs.unshift({ title: homePlaceholder, url: homeUrl });

//   // last link is current page and should not be linked
//   if (crumbs.length > 1) {
//     crumbs[crumbs.length - 1].url = null;
//   }
//   crumbs[crumbs.length - 1]['aria-current'] = 'page';
//   return crumbs;
// }

async function buildBreadcrumbsFromUrl(currentUrl) {
  const crumbs = [];
  const homeUrl = document.querySelector('.nav-brand a').href;
  const urlObj = new URL(currentUrl);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean); // Remove empty strings from the array

  // Always add the home breadcrumb
  crumbs.push({ title: 'Home', url: homeUrl });

  const hasLocale = pathSegments[0].length === 2;
  const basePathIndex = hasLocale ? 1 : 0;

  // Loop through each segment after the base path index (and locale if present)
  for (let i = basePathIndex; i < pathSegments.length; i += 1) {
    let title;
    const segment = pathSegments[i];

    // Check for specific segments like 'lost-pet-protection'
    if (segment === 'lost-pet-protection') {
      title = 'Pet Protection'; // Specific title for 'lost-pet-protection'
    } else {
      // Automatically generate title for other segments
      title = segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    const url = i === pathSegments.length - 1 ? null : `${urlObj.origin}/${pathSegments.slice(0, i + 1).join('/')}`;
    crumbs.push({ title, url });
  }

  // Last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';

  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  // old: ',nav-sections'  ... new: '.nav-meganav'
  const crumbs = await buildBreadcrumbsFromUrl(document.location.href);

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
    if (!isDesktopLG.matches) {
      const expanded = languageSelector.getAttribute('aria-expanded') === 'true';
      languageSelector.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    }
  });
  languageSelector.addEventListener('mouseenter', () => {
    if (isDesktopLG.matches) {
      languageSelector.setAttribute('aria-expanded', 'true');
    }
  });
  languageSelector.addEventListener('mouseleave', () => {
    if (isDesktopLG.matches) {
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
            cta_location: 'header_cta',
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
 * Fetch images from the document based media folder.
 * @param {Element} block The header block element
 */
function fetchImagesFromMediaFolder(block) {
  block.querySelectorAll('source').forEach((source) => {
    let src;
    try {
      src = new URL(source.srcset);
    } catch (e) {
      src = new URL(source.srcset, baseDomain);
    }
    src.pathname = `/blog${src.pathname}`;
    source.srcset = `.${src.pathname}${src.search}`;
  });

  block.querySelectorAll('img').forEach((img) => {
    let src;
    try {
      src = new URL(img.src);
    } catch (e) {
      src = new URL(img.src, baseDomain);
    }
    src.pathname = `/blog${src.pathname}`;
    img.src = `.${src.pathname}${src.search}`;
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

  // Append promo banner
  const promoBanner = await buildPromoBanner();
  if (promoBanner) {
    block.append(promoBanner);
  }

  // Append membership hover content
  const membershipsHoverContent = nav.querySelector('.nav-memberships');
  navWrapper.append(membershipsHoverContent);

  // Append register hover content
  const registerHoverContent = nav.querySelector('.nav-register');
  navWrapper.append(registerHoverContent);

  decorateIcons(nav);
  decorateButtons(nav);
  changeDomain(block);
  addCanadaToLinks(block);
  decorateLinks(block);
  instrumentTrackingEvents(nav);
  removeTargetBlank(nav);
  addLinkToLogo(nav);
  fetchImagesFromMediaFolder(block);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    const main = document.querySelector('main');

    // Create a section for breadcrumbs
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section', 'breadcrumbs-section');
    const contentWrapperDiv = document.createElement('div');
    contentWrapperDiv.classList.add('default-content-wrapper');

    sectionDiv.appendChild(contentWrapperDiv);
    document.body.appendChild(sectionDiv);

    // navWrapper.append(await buildBreadcrumbs());
    contentWrapperDiv.prepend(await buildBreadcrumbs());
    main.prepend(sectionDiv);
  }

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
  const login = nav.querySelector('.login');
  const loginDiv = nav.querySelector('.login > div');
  const loginText = nav.querySelector('.login > div > div:first-child');
  const loginHoverContent = nav.querySelector('.login > div > div:last-child');

  // Add click events.
  navMembershipText.addEventListener('click', () => {
    if (membershipsHoverContent.style.display === 'flex') {
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
      toggleMenu(nav, nav);
    } else {
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
      loginText.className = '';
      if (window.innerWidth <= 1199) {
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
      if (window.innerWidth <= 719) {
        loginText.className = 'before-click';
      }
    } else {
      loginHoverContent.style.display = 'flex';
      loginText.className = 'active';
      membershipsHoverContent.style.display = 'none';
      membershipDiv.className = 'before-click';
      registerHoverContent.style.display = 'none';
      registerDiv.className = 'before-click';
      if (window.innerWidth <= 719) {
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

  if (window.innerWidth <= 1199) {
    if (window.innerWidth >= 720) {
      navBrand.append(login);
    }
    if (window.innerWidth <= 719) {
      loginText.className = 'before-click';
    }
    navBrand.append(nav.querySelector('.button-container'));
    navMembershipText.append(membershipsHoverContent);
    navRegisterText.append(registerHoverContent);
    languageSelected.append(countryName);
  }

  // Do this on resize
  window.addEventListener('resize', () => {
    countryName = isCanada ? 'Canada' : 'United States';
    const navBrandLogin = navBrand.querySelector('.login');
    if (window.innerWidth <= 1199) {
      if (window.innerWidth >= 720) {
        navBrand.append(login);
        loginText.classList.remove('before-click');
        loginText.classList.remove('after-click');
      }
      if (window.innerWidth <= 719) {
        if (navBrandLogin !== null) {
          navBrandLogin.remove();
        }
        loginText.className = 'before-click';
        navMega.append(login);
      }
      navBrand.append(nav.querySelector('.button-container'));
      navMembershipText.append(membershipsHoverContent);
      navRegisterText.append(registerHoverContent);
      if (languageSelected.innerHTML === '') {
        languageSelected.innerHTML = countryName;
      }
    } else {
      navMega.append(login);
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
  //       if (!isTablet.matches && !isDesktopLG.matches && e.target.tagName === 'A') return;

  //       const expanded = navSection.getAttribute('aria-expanded') === 'true';
  //       navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  //     });
  //     navSection.addEventListener('mouseenter', () => {
  //       if (isDesktopLG.matches) {
  //         navSection.setAttribute('aria-expanded', 'true');
  //       }
  //     });
  //     navSection.addEventListener('mouseleave', () => {
  //       if (isDesktopLG.matches) {
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
  toggleMenu(nav, navMega, isDesktopLG.matches);
  isDesktopLG.addEventListener('change', () => closeAllMenus(nav, nav));

  // Close dropdown content on scroll.
  window.addEventListener('scroll', () => {
    registerHoverContent.style.display = 'none';
    registerDiv.className = 'before-click';
    membershipsHoverContent.style.display = 'none';
    membershipDiv.className = 'before-click';
    loginHoverContent.style.display = 'none';
    loginText.className = '';
    if (window.innerWidth <= 719) {
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
      if (window.innerWidth <= 719) {
        loginText.className = 'before-click';
      }
    }
  }, false);
}
