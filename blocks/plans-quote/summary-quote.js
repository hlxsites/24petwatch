import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';

export default async function decorateSummaryQuote(block) {
  // add in the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/plans-quote/summary-quote.css';
  document.head.appendChild(link);

  // create the HTML
  const msg = isCanada ? 'Howdy from Canada!' : 'Howdy from the United States!';
  block.innerHTML = jsx`
    <p>${msg} ... TBD</p> <!-- TODO: flesh -->
  `;
}
