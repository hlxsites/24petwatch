import { loadScript } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const blockMetadata = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const row of block.children) {
    const key = row.children[0].textContent;
    const value = row.children[1].innerText;
    if (key) {
      blockMetadata[key] = value;
    }
  }

  block.innerText = '';
  block.setAttribute('id', '24petwatch-quote-form');

  loadScript('https://quote.petplace.com/lib/widgets/petplace/quote-form/widget.min.js', { async: true }).then(() => {
    if (window.QuoteEngine) {
      window.QuoteEngine.setOptions({
        targetId: '24petwatch-quote-form',
        redirectUrl: 'https://quote.petplace.com/quote',
        baseUrl: 'https://quote.petplace.com',
        urlParam: {
          source: blockMetadata.source || '',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_content: '',
          utm_term: '',
        },
        refCode: '24petwatch',
      });
      window.QuoteEngine.init();
    }
  });
}
