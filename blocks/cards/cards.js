import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

const host = 'https://www.24petwatch.com';
const sitesearchUrl = 'https://www.24petwatch.com/bin/24pethealth/sitesearch.json';
const sitesearchPayload = JSON.stringify({
  context: '/content/24petwatch/us/en/blog/jcr:content/root/container/container_177885842/container_51910998/contentsearchresults',
  resultsPerPage: 3,
  requestedPage: 1,
});

function wrapInAnchor(element, href) {
  const anchor = document.createElement('a');
  anchor.classList.add('wrapping-anchor');
  anchor.href = href;
  element.replaceWith(anchor);
  anchor.appendChild(element);
}

function createBlogCard(item = {}) {
  const blogThumbnail = `${host}${item.url.replace('.html', '')}.thumb.319.319.png`;
  const blogUrl = `${host}${item.url.substring(item.url.indexOf('/blog')).replace('.html', '')}`;

  return `<div>
            <picture><img loading="lazy" alt="" src="${blogThumbnail}"></picture>
        </div>
        <div>
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p><a href="${blogUrl}">Read more</a></p>
        </div>`;
}

async function populateBlogTeaser(block) {
  const response = await fetch(sitesearchUrl, {
    method: 'POST',
    body: sitesearchPayload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const blogItems = await response.json();

  (blogItems.results || []).forEach((item) => {
    const card = document.createElement('div');
    card.innerHTML = createBlogCard(item);
    block.append(card);
  });
}

export default async function decorate(block) {
  const isBlogTeaser = block.classList.contains('blog-teaser');
  if (isBlogTeaser) {
    await populateBlogTeaser(block);
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = row.innerHTML;
    [...li.children].forEach((div) => {
      const href = li.querySelector('a')?.href;

      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
        wrapInAnchor(div, href);
      } else {
        div.className = 'cards-card-body';
        const h4 = li.querySelector('h4');
        wrapInAnchor(h4, href);
      }
    });
    ul.append(li);
  });

  [...ul.querySelectorAll('img')]
    .filter((img) => !(img.src || '').startsWith('http')) // do not optimize absolute images for now
    .forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
