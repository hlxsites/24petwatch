import {
  decorateLinks,
  isCanada,
} from '../../scripts/lib-franklin.js';
import { changeDomain, addCanadaToLinks } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';

  let baseFooterUrl = '/fragments/us/footer-paid';
  if (isCanada) {
    baseFooterUrl = '/fragments/ca/footer-paid';
  }

  // fetch footer content
  const resp = await fetch(`${baseFooterUrl}.plain.html`);

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

      const logos = [...div.querySelectorAll('p > picture')]
        .map((picture) => picture.parentElement);
      // logos.forEach((picture) => console.log('Logo:', picture));
      const listItems = [...div.querySelectorAll('ul > li')];
      const socialIcons = [];
      const paragraphs = [];
      const linkItems = [];

      // Process list elements to identify social icons and links
      listItems.forEach((li) => {
        const picture = li.querySelector('picture');
        const anchor = li.querySelector('a');
        if (picture && anchor) {
          li.classList.add('social-icon');
          socialIcons.push(li);
        } else if (anchor) {
          li.classList.add('link-item');
          linkItems.push(li);
        }
      });

      const textInfoBlocks = [...div.querySelectorAll('p:not(:has(img))')];
      textInfoBlocks.forEach((p) => {
        p.classList.add('text-info-block');
        paragraphs.push(p);
      });

      if (logos.length > 0) {
        const logo = document.createElement('div');
        logo.classList.add('footer-logo');
        logos.forEach((img) => {
          logo.appendChild(img);
        });
        footer.appendChild(logo);
      }

      if (socialIcons.length > 0) {
        const socialIconList = document.createElement('ul');
        socialIconList.classList.add('social-icon-list');

        socialIcons.forEach((li) => {
          const picture = li.querySelector('picture');
          const anchor = document.createElement('a');
          anchor.href = li.querySelector('a').href;
          anchor.target = '_blank';

          // Move picture inside anchor
          anchor.appendChild(picture);

          // Clear the li and append the anchor
          li.innerHTML = '';
          li.appendChild(anchor);

          socialIconList.appendChild(li);
        });

        footer.appendChild(socialIconList);
      }

      if (paragraphs.length > 0) {
        const paragraphList = document.createElement('ul');
        paragraphList.classList.add('paragraph-list');
        paragraphs.forEach((li) => paragraphList.appendChild(li));
        footer.appendChild(paragraphList);
      }

      if (linkItems.length > 0) {
        const linkItemList = document.createElement('ul');
        linkItemList.classList.add('link-item-list');
        linkItems.forEach((li) => linkItemList.appendChild(li));
        footer.appendChild(linkItemList);
      }
    });

    changeDomain(footer);
    addCanadaToLinks(footer);
    decorateLinks(footer);
    block.append(footer);
  }
}
