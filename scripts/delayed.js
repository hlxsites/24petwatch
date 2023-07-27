// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
import { analyticsSetConsent } from './lib-analytics';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
await analyticsSetConsent(true);
