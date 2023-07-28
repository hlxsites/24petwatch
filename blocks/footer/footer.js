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
      const headings = div.querySelectorAll('h1, h2, h3, h4');
      const logos = div.querySelectorAll('p:has(picture)');

      if (headings.length > 0) {
        const headingWrapper = document.createElement('div');
        headingWrapper.classList.add('footer-heading-wrapper');

        let currentSection;

        headings.forEach((heading) => {
          heading.classList.add('footer-heading');
          if (heading.tagName === 'H3') {
            heading.nextElementSibling.classList.add('collapsed');
            heading.addEventListener('click', () => {
              heading.nextElementSibling.classList.toggle('collapsed');
            });
          }

          const nextSibling = heading.nextElementSibling;

          if (heading.tagName === 'H4') {
            const subheadingContainer = document.createElement('div');
            subheadingContainer.classList.add('footer-subheading-container');
            nextSibling.classList.add('collapsed');

            subheadingContainer.addEventListener('click', () => {
              nextSibling.classList.toggle('collapsed');
            });

            heading.classList.add('footer-subheading');
            subheadingContainer.appendChild(heading);
            if (currentSection) {
              currentSection.appendChild(subheadingContainer);
              currentSection.appendChild(nextSibling);
            }
          } else {
            currentSection = document.createElement('div');
            currentSection.classList.add('footer-heading-section');
            currentSection.appendChild(heading);
            currentSection.appendChild(nextSibling);
            headingWrapper.appendChild(currentSection);
          }
        });
        footer.appendChild(headingWrapper);
      } else if (logos.length > 0) {
        const logo = document.createElement('div');
        logo.classList.add('footer-logo');
        logos.forEach((img) => {
          logo.appendChild(img);
        });
        footer.appendChild(logo);
      } else {
        footer.appendChild(div);
      }
    });

    decorateIcons(footer);
    block.append(footer);
  }
}
