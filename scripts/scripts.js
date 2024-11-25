import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateLinks,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  getMetadata,
  isCanada,
} from './lib-franklin.js';

import {
  martechInit,
  martechEager,
  martechLazy,
  martechDelayed,
  updateUserConsent,
} from './lib-martech-loader.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

export function jsx(html, ...args) {
  return html.slice(1).reduce((str, elem, i) => str + args[i] + elem, html[0]);
}

window.hlx.templates.add([
  '/templates/paid-blog-page',
]);

/**
 * A generic helper function that checks if we are in a mobile context based on viewport size
 * @returns true if we are on a mobile, and false otherwise
 */
export function isMobile() {
  return window.innerWidth < 600;
}

/**
 * A generic helper function that checks if we are in a tablet context based on viewport size
 * @returns true if we are on a tablet, and false otherwise
 */
export function isTablet() {
  return window.innerWidth < 1024;
}

/**
 * Gets the value of a placeholder.
 * @param {string} key The key of the placeholder to retrieve
 * @param {Object} options The template strings to use
 * @returns the desired placeholder string, or throws an error if not found
 */
export function getPlaceholder(key, options = {}) {
  if (!window.placeholders) {
    throw new Error('Please load placeholders first using "fetchPlaceholders".');
  }
  const placeholders = window.placeholders[window.hlx.contentBasePath || 'default'];
  if (!placeholders[key]) {
    throw new Error(`Placeholder "${key}" not found`);
  }
  return Object.entries(options).reduce((str, [k, v]) => str.replace(`{{${k}}}`, v), placeholders[key]);
}
const martechLoadedPromise = martechInit(
  { personalization: !!getMetadata('target') },
);

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  if (!h1 || !picture) {
    return;
  }
  const isPictureInDiv = picture.closest('div');
  if (
    h1
    && picture
    && !isPictureInDiv
    // eslint-disable-next-line no-bitwise
    && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)
  ) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

function buildBlockPostPage(main) {
  // Below h1
  const h1 = main.querySelector('h1');
  const socialMediaButtons = document.createRange().createContextualFragment('<div class="sharing"></div>');

  if (h1) {
    const author = h1.parentElement.querySelector('h1 + p > em');
    if (author) {
      const authorElem = document.createRange().createContextualFragment(`<p class="author">${author.innerText}</p>`);
      author.parentElement.replaceWith(authorElem);
    }

    h1.parentElement.insertBefore(socialMediaButtons.cloneNode(true), h1.nextSibling);
  }

  // Below last content
  const lastContentSection = main.querySelector('* > div:last-of-type');
  if (lastContentSection) {
    lastContentSection.appendChild(socialMediaButtons.cloneNode(true));

    const fragmentPath = isCanada ? '/ca/blog/fragments/blog-footer' : '/blog/fragments/blog-footer';
    const fragment = document.createRange().createContextualFragment(`<div><div class="fragment">${fragmentPath}</div></div>`);
    lastContentSection.parentElement.appendChild(fragment);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    if (main.parentNode !== document.body) {
      return;
    }

    const baseDomain = !window.location.port
      ? `${window.location.protocol}//${window.location.hostname}`
      : `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    if (document.body.classList.contains('blog-post') || document.body.classList.contains('blog-index')) {
      main.querySelectorAll('source').forEach((source) => {
        let src;
        try {
          src = new URL(source.srcset);
        } catch (e) {
          src = new URL(source.srcset, baseDomain);
        }
        src.pathname = `/blog${src.pathname}`;
        source.srcset = `.${src.pathname}${src.search}`;
      });

      main.querySelectorAll('img').forEach((img) => {
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

    if (!document.body.classList.contains('blog-post')) {
      buildHeroBlock(main);
    } else {
      buildBlockPostPage(main);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

export function changeDomain(block) {
  block.querySelectorAll('a').forEach((anchor) => {
    const url = new URL(anchor.href);
    if (url.hostname === 'www.24petwatch.com' || url.hostname === '24petwatch.com') {
      url.protocol = window.location.protocol;
      url.hostname = window.location.hostname;
      url.port = window.location.port;
      anchor.href = url.toString();
    }
  });
}

/**
 * Rewrite links to add Canada to the path
 * @param {Element} block The block element
 */
export function addCanadaToLinks(block) {
  if (isCanada) {
    block.querySelectorAll('a').forEach((anchor) => {
      if (anchor.getAttribute('rel') === 'alternate') return;
      const url = new URL(anchor.href);
      const newUrl = new URL(anchor.href, window.location.origin);
      if (url.hostname === window.location.hostname) {
        // change only for internal links
        if (!url.pathname.startsWith('/ca/')) {
          newUrl.pathname = `/ca${url.pathname}`;
          anchor.href = newUrl.toString();
        }
      }
    });
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  changeDomain(main);
  addCanadaToLinks(main);
  decorateLinks(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

export function loadScript(url, attrs, callback) {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  script.onload = callback;
  if (attrs) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const attr in attrs) {
      script.setAttribute(attr, attrs[attr]);
    }
  }
  head.append(script);
  return script;
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  await window.hlx.plugins.run('loadEager');

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await Promise.all([
      martechLoadedPromise.then(martechEager),
      waitForLCP(LCP_BLOCKS),
    ]);
  }
}

function cleanLocalhostLinks(main) {
  main.querySelectorAll('a')
    .forEach((anchor) => {
      if (anchor.href.startsWith('http://localhost:3001')) {
        const url = new URL(anchor.href);
        url.hostname = 'www.24petwatch.com';
        url.scheme = 'https';
        url.port = '';
        anchor.href = url.toString();
      }
    });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await window.hlx.plugins.run('loadLazy');
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));

  updateUserConsent({
    collect: true, // analytics
    personalize: true, // target
  });

  await martechLazy();
  cleanLocalhostLinks(main);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // load anything that can be postponed to the latest here
  window.setTimeout(() => {
    window.hlx.plugins.load('delayed');
    window.hlx.plugins.run('loadDelayed');
    martechDelayed();
    return import('./delayed.js');
  }, 3000);
}

async function loadPage() {
  await window.hlx.plugins.load('eager');
  await loadEager(document);
  await window.hlx.plugins.load('lazy');
  await loadLazy(document);
  loadDelayed();
}

loadPage();
