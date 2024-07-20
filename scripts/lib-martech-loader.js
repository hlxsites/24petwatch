/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getMetadata, sampleRUM, toClassName } from './lib-franklin.js';
import {
  initMartech,
  updateUserConsent,
  martechEager as alloyMartechEager,
  martechLazy as alloyMartechLazy,
  martechDelayed as alloyMartechDelayed,
  pushEventToDataLayer,
  sendAnalyticsEvent,
// eslint-disable-next-line import/no-relative-packages
} from '../plugins/martech/src/index.js';

/**
 * Customer's XDM schema namespace
 * @type {string}
 */
const CUSTOM_SCHEMA_NAMESPACE = '_pethealthinc';

/**
 * Returns datastream id to use as edge configuration id
 * Custom logic can be inserted here in order to support
 * different datastream ids for different environments (non-prod/prod)
 * @returns {{edgeConfigId: string, orgId: string}}
 */
function getDatastreamConfiguration() {
  const datastreamIds = {
    prod: '3843429b-2a2d-43ce-9227-6aa732ddf7da',
    stage: '1b0ec0ce-b541-4d0f-a78f-fb2a6ca8713c',
    dev: '17e9e2de-4a10-40e0-8ea8-3cb636776970',
  };
  return {
    orgId: '53E06E76604280A10A495E65@AdobeOrg', // Pet Insurance Agency Ltd
    edgeConfigId: (window.location.origin.endsWith('.petwatch.com') && datastreamIds.prod)
      || (window.location.origin.endsWith('.live') && datastreamIds.stage)
      || (window.location.origin.endsWith('.page') && datastreamIds.stage)
      || datastreamIds.dev,
  };
}

/**
 * Returns the launch container url for the current environment.
 * @returns {String} the url for the launch container to use
 */
function getLaunchUrl() {
  const launchUrls = {
    prod: 'https://assets.adobedtm.com/1dfc778c2201/a647bfde1ad6/launch-65a15c61459b.min.js',
    stage: 'https://assets.adobedtm.com/1dfc778c2201/24a35e3b5925/launch-e3eada7c19a6.min.js',
    dev: 'https://assets.adobedtm.com/1dfc778c2201/30981f80b9f3/launch-72f522e92a26.min.js',
  };
  return (window.location.origin.endsWith('.petwatch.com') && launchUrls.prod)
    || (window.location.origin.endsWith('.live') && launchUrls.stage)
    || (window.location.origin.endsWith('.page') && launchUrls.stage)
    || launchUrls.dev;
}

/**
 * Returns script that initializes a queue for each GTM instance,
 * in order to be ready to receive events before the google martech stack is loaded
 * @type {string}
 */
function initGTMInitScript() {
  window.dataLayer ||= [];
  window.dataLayer.push({
    event: 'gtm.js',
    'gtm.start': new Date().getTime(),
  });
}

/**
 * Returns experiment id and variant running
 * @returns {{experimentVariant: *, experimentId}}
 */
function getExperimentDetails() {
  let experiment;
  if (window.hlx.experiment) {
    experiment = {
      experimentId: window.hlx.experiment.id,
      experimentVariant: window.hlx.experiment.selectedVariant,
    };
  }
  return experiment;
}

/**
 * Enhance all events with additional details, like experiment running,
 * before sending them to the edge
 * @param options event in the XDM schema format
 */
function enhanceAnalyticsEvent(options) {
  const experiment = getExperimentDetails();
  options.xdm[CUSTOM_SCHEMA_NAMESPACE] = {
    ...options.xdm[CUSTOM_SCHEMA_NAMESPACE],
    ...(experiment ? { experiment } : {}), // add experiment details, if existing, to all events
  };
  options.xdm.web = options.xdm.web || {};
  options.xdm.web.webPageDetails = options.xdm.web.webPageDetails || {};
  options.xdm.web.webPageDetails.server = 'Franklin';

  // eslint-disable-next-line no-console
  console.debug(`enhanceAnalyticsEvent complete: ${JSON.stringify(options)}`);
}

/**
 * Returns alloy configuration
 * Documentation https://experienceleague.adobe.com/docs/experience-platform/edge/fundamentals/configuring-the-sdk.html
 */
export function getAlloyConfiguration(document) {
  return {
    // enable while debugging
    debugEnabled: document.location.hostname.startsWith('localhost'),
    // disable when clicks are also tracked via sendEvent with additional details
    clickCollectionEnabled: true,
    // adjust default based on customer use case
    defaultConsent: 'pending',
    ...getDatastreamConfiguration(),
    onBeforeEventSend: (options) => enhanceAnalyticsEvent(options),
  };
}

/**
 * Basic tracking for page views with alloy
 * @param document
 * @param additionalXdmFields
 * @returns {Promise<*>}
 */
async function analyticsTrackPageViews(document, additionalXdmFields = {}) {
  const { pathname, hostname } = window.location;
  const canonicalMeta = document.head.querySelector('link[rel="canonical"]');
  const url = canonicalMeta ? new URL(canonicalMeta.href).pathname : pathname;
  const is404 = window.isErrorPage;
  return sendAnalyticsEvent(
    {
      event: 'web.webpagedetails.pageViews',
      web: {
        webPageDetails: {
          pageViews: {
            value: is404 ? 0 : 1,
          },
          isHomePage: pathname === '/',
        },
      },
      [CUSTOM_SCHEMA_NAMESPACE]: {
        ...additionalXdmFields,
      },
    },
    {
      __adobe: {
        analytics: {
          channel: !is404 ? pathname.split('/')[1] || 'home' : '404',
          cookiesEnabled: navigator.cookieEnabled ? 'Y' : 'N',
          pageName: !is404
            ? pathname.split('/').slice(1).join(':') + (pathname.endsWith('/') ? 'home' : '')
            : undefined,
          pageType: is404 ? 'errorPage' : undefined,
          server: window.location.hostname,
          contextData: {
            canonical: !is404 ? url : '/404',
            environment: (hostname === 'localhost' && 'dev')
              || (hostname.endsWith('.page') && 'preview')
              || (hostname.endsWith('.live') && 'live')
              || 'prod',
            language: document.documentElement.getAttribute('lang') || 'en',
            template: document.head.querySelector('meta[name="template"]')?.content?.toLowerCase() || 'default',
          },
        },
      },
    },
  );
}

/**
 * Creates the required datalayer object required for google stack
 * @returns {Promise<void>}
 */
async function setupAnalyticsTrackingWithGTM() {
  setTimeout(() => {
    const id = 'GTM-MNF423K';
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    script.async = true;
    document.head.append(script);
  }, 3000);
}

/**
 * Track a GTM event in the datalayer
 * @param {String} event the event name to track
 * @param {Object} payload the payload for the event
 */
export function trackGTMEvent(event, payload = {}) {
  window.dataLayer.push({
    event,
    ...payload,
  });
}

/**
 * Track an AEP event in the datalayer
 * @param {String} event the event name to track
 * @param {Object} [xdm] the XDM data for the event
 * @param {Object} [dataMapping] the additional data mapping for the event
 */
export function trackAepEvent(event, xdm = {}, dataMapping = {}) {
  pushEventToDataLayer(event, xdm, dataMapping);
}

/**
 * Sends a specific conversion event in Analytics
 * @param {Object} rumData the data for the conversion
 * @param {Object} [additionalXdmFields] additional XDm data to add to the event
 * @returns {Promise<*>} a promise that the event was sent
 */
async function sendConversionEvent(rumData, additionalXdmFields = {}) {
  const { source: conversionName, target: conversionValue, element } = rumData;

  const xdmData = {
    eventType: 'web.webinteraction.conversion',
    [CUSTOM_SCHEMA_NAMESPACE]: {
      conversion: {
        conversionComplete: 1,
        conversionName,
        conversionValue,
      },
      ...additionalXdmFields,
    },
  };

  if (element.tagName === 'FORM') {
    xdmData.eventType = 'web.formFilledOut';
    const formId = element?.id || element?.dataset?.action;
    xdmData[CUSTOM_SCHEMA_NAMESPACE].form = {
      ...(formId && { formId }),
      // don't count as form complete, as this event should be tracked separately,
      // track only the details of the form together with the conversion
      formComplete: 0,
    };
  } else if (element.tagName === 'A') {
    xdmData.eventType = 'web.webinteraction.linkClicks';
    xdmData.web = {
      webInteraction: {
        URL: `${element.href}`,
        // eslint-disable-next-line no-nested-ternary
        name: `${element.text ? element.text.trim() : (element.innerHTML ? element.innerHTML.trim() : '')}`,
        linkClicks: {
          // don't count as link click, as this event should be tracked separately,
          // track only the details of the link with the conversion
          value: 0,
        },
        type: 'other',
      },
    };
  }

  return sendAnalyticsEvent(xdmData);
}

/**
 * Initialized the conversion tracking logic.
 */
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
    if (!element || !window.alloy) {
      return;
    }
    // form tracking related logic should be added here if need be.
    // see https://github.com/adobe/franklin-rum-conversion#integration-with-analytics-solutions
    sendConversionEvent({ ...data });
  });
}

/**
 * instruments the tracking in the main
 * @param {Element} main The main element
 */
function instrumentGTMTrackingEvents(main) {
  main.querySelectorAll('a')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const linkText = (e.target.textContent || '').trim();
        const linkUrl = e.target.href;

        // track cta clicks on main
        if (e.target.classList.contains('button')) {
          trackGTMEvent('cta_click', {
            link_text: linkText,
            link_url: linkUrl,
          });
        }
      });
    });
}

/**
 * Initialize the hybrid martech stack.
 * @param {Object} config the AEM Martech plugin config
 * @returns {Promise<*>} a promise that the martech stack was initialized
 */
async function init(config) {
  initGTMInitScript();
  return initMartech(getAlloyConfiguration(document), {
    launchUrls: [getLaunchUrl()],
    ...config,
  });
}

/**
 * Runs the eager hybrid martech logic.
 * @returns {Promise<*>} a promise that the eager martech logic was run
 */
async function loadEager() {
  return alloyMartechEager();
}

/**
 * Runs the lazy hybrid martech logic.
 * @returns {Promise<*>} a promise that the lazy martech logic was run
 */
async function loadLazy() {
  const main = document.querySelector('main');
  instrumentGTMTrackingEvents(main);
  await alloyMartechLazy();
  await setupAnalyticsTrackingWithGTM();
  await initializeConversionTracking();
  return analyticsTrackPageViews(document);
}

/**
 * Runs the delayed hybrid martech logic.
 * @returns {Promise<*>} a promise that the delayed martech logic was run
 */
async function loadDelayed() {
  return alloyMartechDelayed();
}

export {
  init as martechInit,
  loadEager as martechEager,
  loadLazy as martechLazy,
  loadDelayed as martechDelayed,
  updateUserConsent,
};
