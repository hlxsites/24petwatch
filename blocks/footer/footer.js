import { trackGTMEvent } from '../../scripts/lib-analytics.js';
import {
  readBlockConfig,
  decorateIcons,
  decorateLinks,
  isMobile,
  isCanada,
} from '../../scripts/lib-franklin.js';
import { changeDomain, addCanadaToLinks } from '../../scripts/scripts.js';
import { DNS_LINK_TEXT, DNS_PLACEHOLDER } from '../../scripts/24petwatch-utils.js';

const socialNetworks = ['Instagram', 'X', 'Facebook'];

/**
 * instruments the tracking in the footer
 * @param {Element} footer The footer block element
 */
function instrumentTrackingEvents(footer) {
  footer.querySelectorAll('a')
    .forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const menuLocation = isMobile.matches ? 'mobile' : 'footer';
        const pageLocation = window.location.pathname;
        const pageUrl = window.location.href;
        const linkText = (e.target.textContent || '').trim();
        const linkUrl = e.target.href;

        // track navigation events
        trackGTMEvent('navigation', {
          menu_location: menuLocation,
          link_text: linkText,
          link_url: linkUrl,
        });

        // track social media clicks
        const socialNetwork = socialNetworks
          .find((social) => linkUrl.includes(social.toLowerCase()));

        if (socialNetwork) {
          trackGTMEvent('social_interactions', {
            page_location: pageLocation,
            social_network: socialNetwork,
          });
        }

        // track clicks to call
        if (linkUrl.startsWith('tel')) {
          trackGTMEvent('click_to_call', {
            page_url: pageUrl,
          });
        }
      });
    });
}

/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
function wrapImgsInLinks(container) {
  const pictures = container.querySelectorAll('picture');
  pictures.forEach((pic) => {
    const link = pic.nextElementSibling;
    if (link && link.tagName === 'A' && link.href) {
      const img = pic.querySelector('img');
      if (img) {
        const newAnchor = document.createElement('a');
        newAnchor.href = link.href;
        img.parentNode.insertBefore(newAnchor, img);
        newAnchor.appendChild(img);
      }
      link.remove();
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  let baseFooterUrl = '/fragments/us/footer';
  if (isCanada) {
    baseFooterUrl = '/fragments/ca/footer';
  }

  // fetch footer content
  const footerPath = cfg.footer || baseFooterUrl;
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
      const logos = [...div.querySelectorAll('p > picture')]
        .map((picture) => picture.parentElement);

      if (headings.length > 0) {
        const headingWrapper = document.createElement('div');
        headingWrapper.classList.add('footer-heading-wrapper');

        let currentSection;

        headings.forEach((heading) => {
          heading.classList.add('footer-heading');
          if (heading.tagName === 'H3') {
            heading.addEventListener('click', () => {
              heading.parentElement.classList.toggle('collapsed');
            });
          }

          const nextSibling = heading.nextElementSibling;

          if (heading.tagName === 'H4') {
            const subheadingContainer = document.createElement('div');
            subheadingContainer.classList.add('footer-subheading-container');
            subheadingContainer.classList.add('collapsed');

            subheadingContainer.addEventListener('click', () => {
              subheadingContainer.classList.toggle('collapsed');
            });

            heading.classList.add('footer-subheading');
            const subList = heading.nextElementSibling;
            subheadingContainer.appendChild(heading);
            subheadingContainer.appendChild(subList);
            if (currentSection) {
              currentSection.appendChild(subheadingContainer);
            }
          } else {
            currentSection = document.createElement('div');
            currentSection.classList.add('footer-heading-section');
            currentSection.appendChild(heading);
            currentSection.appendChild(nextSibling);
            headingWrapper.appendChild(currentSection);

            if (currentSection.querySelector('h2')) {
              currentSection.classList.add('h2-container');
            } else {
              currentSection.classList.add('collapsed');
            }

            [...currentSection.querySelectorAll('span.icon')].forEach((icon) => {
              if (icon.nextElementSibling.tagName === 'A') {
                icon.nextElementSibling.prepend(icon);
              }
            });
          }
        });
        footer.appendChild(headingWrapper);
      } else if (logos.length > 0) {
        const logo = document.createElement('div');
        logo.classList.add('footer-logo');
        logos.forEach((img) => {
          wrapImgsInLinks(img);
          logo.appendChild(img);
        });
        footer.appendChild(logo);
      } else {
        footer.appendChild(div);
      }

      const uls = div.querySelectorAll('ul');
      if (uls.length > 0) {
        const lastUl = uls[uls.length - 1];
        // Osano Do Not Sell link replacement
        const listItems = lastUl.querySelectorAll('li');
        // eslint-disable-next-line no-use-before-define,max-len
        const itemWithPlaceholder = [...listItems].find((li) => li.textContent.includes(DNS_PLACEHOLDER));
        if (itemWithPlaceholder) {
          const osanoLink = `<a href="#" onclick="Osano.cm.showDoNotSell()">${DNS_LINK_TEXT}</a>`;
          itemWithPlaceholder.innerHTML = osanoLink;
          itemWithPlaceholder.classList.add('osano-do-not-sell');
        }
      }
    });

    decorateIcons(footer);
    changeDomain(footer);
    addCanadaToLinks(footer);
    decorateLinks(footer);
    instrumentTrackingEvents(footer);
    block.append(footer);
  }
}
