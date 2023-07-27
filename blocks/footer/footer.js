import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.classList.add('footer-section-wrapper');

    // transform given html
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const container = doc.querySelectorAll('div');
    container.forEach((div) => {
      div.classList.add('footer-container');
      const headings = div.querySelectorAll('h1, h2, h3');
      if (headings.length > 0) {
        const headingWrapper = document.createElement('div');
        headingWrapper.classList.add('footer-heading-wrapper');
        headings.forEach((h2) => {
          const headingSection = document.createElement('div');
          headingSection.classList.add('footer-heading-section');
          h2.classList.add('footer-heading');

          const nextSibling = h2.nextElementSibling;
          headingSection.appendChild(h2);
          headingSection.appendChild(nextSibling);
          headingWrapper.appendChild(headingSection);
        });
        footer.appendChild(headingWrapper);
      }

      const logos = div.querySelectorAll('p:has(picture)');
      if (logos.length > 0) {
        const logo = document.createElement('div');
        logo.classList.add('footer-logo');
        logos.forEach((img) => {
          logo.appendChild(img);
        });
        footer.appendChild(logo);
      }
    });

    decorateIcons(footer);
    block.append(footer);
  }
}
