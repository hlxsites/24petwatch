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
 

export default async function decorate(block) {
let contentBasePath = '';
  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      contentBasePath = new URL(scriptEl.src).origin.split('/scripts/scripts.js');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }

     // fetch nav content
  let navMeta = null;
  let navPath = '';
  let resp = null;
  console.log("inside header.js");
 // if (document.documentElement.lang.toLowerCase() === 'en-us') {
    // build new mega nav for US clients

console.log("contentBasePath is{} "+contentBasePath);
    navMeta = null;//getMetadata('mega-nav');
    navPath =  contentBasePath+`/drafts/achabuku/mega-nav`;
    resp = await fetch(`${navPath}.plain.html`);

    if (!resp.ok) {
      return;
    }

    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.id = 'og_nav';
    nav.innerHTML = html;

   // const nav = document.createElement('nav');

    const classes = ['hambuger','brand', 'get-quote', 'sections', 'secondary'];
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

/*      // language selector
      const secondaryMenu = nav.querySelector('.nav-secondary');
      decorateLanguageSelector(secondaryMenu);
*/
        const navWrapper = document.createElement('div');
        navWrapper.className = 'nav-wrapper';
        navWrapper.append(nav);
        block.append(navWrapper);
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

    function closeOnEscape(e) {
      if (e.key === 'Escape') {
        closeAllMenus(nav, navSections);
      }
    }
