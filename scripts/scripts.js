/* global alloy */
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
  toClassName,
  isCanada,
} from './lib-franklin.js';

import {
  analyticsSetConsent,
  createInlineScript,
  getAlloyInitScript,
  getGTMInitScript,
  setupAnalyticsTrackingWithAlloy,
  setupAnalyticsTrackingWithGTM,
  analyticsTrackConversion, trackGTMEvent,
} from './lib-analytics.js';

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
    const EXEMPT_PATHS = ['privacy-policy']; // add paths that should not be rewritten
    // check each link in the block
    block.querySelectorAll('a').forEach((anchor) => {
      if (anchor.getAttribute('rel') === 'alternate') return;
      const url = new URL(anchor.href);
      const newUrl = new URL(anchor.href, window.location.origin);
      if (url.hostname === window.location.hostname) {
        // change only for internal links
        if (!url.pathname.startsWith('/ca/')) {
          // if any part of the url is in the exempt list, do not rewrite
          if (EXEMPT_PATHS.some((path) => url.pathname.includes(path))) return;
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
    createInlineScript(document, document.body, getAlloyInitScript(), 'text/javascript');
    createInlineScript(document, document.body, getGTMInitScript(), 'text/javascript');
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

async function initializeConversionTracking() {
  const context = {
    getMetadata,
    toClassName,
  };
  // eslint-disable-next-line import/no-relative-packages
  const { initConversionTracking } = await import('../plugins/rum-conversion/src/index.js');
  await initConversionTracking.call(context, document);

  // call upon conversion events, sends them to alloy
  sampleRUM.always.on('convert', async (data) => {
    const { element } = data;
    if (!element || !alloy) {
      return;
    }
    // form tracking related logic should be added here if need be.
    // see https://github.com/adobe/franklin-rum-conversion#integration-with-analytics-solutions
    analyticsTrackConversion({ ...data });
  });
}

/**
 * instruments the tracking in the main
 * @param {Element} main The main element
 */
function instrumentTrackingEvents(main) {
  main.querySelectorAll('a')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const body = document.querySelector('body');
        const linkText = (e.target.textContent || '').trim();
        const linkUrl = e.target.href;
        const pageUrl = window.location.href;
        let ctaLocation = null;

        const trackCTAEvent = (location) => {
          const eventData = {
            link_text: linkText,
            link_url: linkUrl,
          };
          if (location) {
            eventData.cta_location = location;
          }
          trackGTMEvent('cta_click', eventData);
        };

        // track cta clicks on main
        if (e.target.classList.contains('button')) {
          // track clicks on the Pumpkin Wellness Club page
          if (e.target.closest('[class*="pumpkin-wellness"]')) {
            if (e.target.closest('.hero-pumpkin-wellness')) {
              ctaLocation = 'join_the_club_header';
            } else if (e.target.closest('.how-it-works-pumpkin-wellness')) {
              ctaLocation = 'pick_your_plan';
            } else if (e.target.closest('.curated-products-pumpkin-wellness')) {
              ctaLocation = 'join_the_club_footer';
            } else {
              ctaLocation = 'join_the_club_banner';
            }
            trackCTAEvent(ctaLocation);
          // track .button cta clicks for paid pages
          } else if (body.className.includes('paid')) {
            if (e.target.closest('.hero-paid-membership')) {
              ctaLocation = 'hero_cta';
            } else if (e.target.closest('.lifetime-paid-membership')) {
              ctaLocation = 'lpm_cta';
            } else if (e.target.closest('.callout-vet-helpline')) {
              ctaLocation = 'vet_helpline_cta';
            } else if (e.target.closest('.callout-faq')) {
              ctaLocation = 'faq_cta';
            } else if (linkUrl.includes('lifetime-protection-membership-plus')) {
              ctaLocation = 'lpm_plus_cta';
            } else if (linkUrl.includes('annual-protection-membership')) {
              ctaLocation = 'annual_cta';
            } else if (e.target.closest('.callout-get-a-quote1')) {
              ctaLocation = 'body_1_cta';
            } else if (e.target.closest('.callout-get-a-quote2')) {
              ctaLocation = 'body_2_cta';
            } else {
              const containerBlock = e.target.closest('[data-block-name]');
              // if containerBlock is null, fallback to sections
              if (containerBlock) {
                const blockList = document.querySelectorAll(`[data-block-name=${containerBlock.dataset.blockName}]`);
                blockList.forEach((block, key) => {
                  if (block === containerBlock) {
                    ctaLocation = `${containerBlock.dataset.blockName}_${key}`;
                  }
                });
              } else {
                // check for the closest section
                const parentSection = e.target.closest('.section');
                if (parentSection) {
                  const sectionList = document.querySelectorAll('.section');
                  sectionList.forEach((section, key) => {
                    if (section === parentSection) {
                      ctaLocation = `section_${key}`;
                    }
                  });
                }
              }
            }
            trackCTAEvent(ctaLocation);
            return;
          } else {
            const containerBlock = e.target.closest('[data-block-name]');
            // if containerBlock is null, fallback to sections
            if (containerBlock) {
              const blockList = document.querySelectorAll(`[data-block-name=${containerBlock.dataset.blockName}]`);
              blockList.forEach((block, key) => {
                if (block === containerBlock) {
                  ctaLocation = `${containerBlock.dataset.blockName}_${key}`;
                }
              });
            } else {
              // check for the closest section
              const parentSection = e.target.closest('.section');
              if (parentSection) {
                const sectionList = document.querySelectorAll('.section');
                sectionList.forEach((section, key) => {
                  if (section === parentSection) {
                    ctaLocation = `section_${key}`;
                  }
                });
              }
            }
            trackCTAEvent(ctaLocation);
            return;
          }
        }

        // track clicks to call for telephone numbers
        if (linkUrl.startsWith('tel')) {
          trackGTMEvent('click_to_call', {
            page_url: pageUrl,
          });
        }

        // track clicks for Login to MyPetHealth
        if (linkUrl === 'https://mypethealth.com/auth/login') {
          trackGTMEvent('pet_lost_report_mypethealth_link');
        }

        // track clicks on the Paid: FAQ page
        if (body.classList.contains('paid')) {
          if (e.target.closest('.faq-paid-membership')) {
            ctaLocation = 'faq_cta';
          }
          trackCTAEvent(ctaLocation);
        }
      });
    });
}

function cleanLocalhostLinks(main) {
  main.querySelectorAll('a')
    .forEach((anchor) => {
      if (anchor.href.startsWith('http://localhost:3001')) {
        const url = new URL(anchor.href);
        url.hostname = window.location.hostname;
        url.protocol = window.location.protocol;
        url.port = window.location.port;
        anchor.href = url.toString();
        // remove target="_blank" from localhost links
        anchor.removeAttribute('target');
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

  await setupAnalyticsTrackingWithAlloy(document);
  await setupAnalyticsTrackingWithGTM();
  analyticsSetConsent(true);
  await initializeConversionTracking();
  instrumentTrackingEvents(main);
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
    // eslint-disable-next-line import/no-cycle
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
