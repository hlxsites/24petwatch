import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

// eslint-disable-next-line no-unused-vars
const fetchBlogPosts = async (page = 1, tags = [], pagesize = 9) => {
  // TODO: Fetch whole index and cache it in sessionStorage to enable filtering and fulltext search
  let index = new URL('/blog/query-index.json', window.location.origin);
  if (!window.location.hostname.includes('24petwatch.com')) {
    index = new URL('https://main--24petwatch--hlxsites.hlx.live/blog/query-index.json');
  }

  const limit = pagesize;
  const offset = (page - 1) * pagesize;
  index.searchParams.set('limit', limit);
  index.searchParams.set('offset', offset);

  const response = await fetch(index);
  const json = await response.json();

  // TODO: Filter by tags once available in index

  return {
    items: json.data,
    pages: Math.ceil(json.total / pagesize),
    currentPage: Math.max(1, page, Math.ceil(json.total / pagesize)),
  };
};

function wrapInAnchor(element, href) {
  const anchor = document.createElement('a');
  anchor.classList.add('wrapping-anchor');
  anchor.href = href;
  element.replaceWith(anchor);
  anchor.appendChild(element);
}

function createBlogCard(item = {}) {
  let { title, image, path } = item;
  const { description } = item;

  if (!window.location.hostname.includes('24petwatch.com')) {
    path = new URL(path, 'https://www.24petwatch.com').toString();
  }
  try {
    if (image === '0') {
      throw new Error('invalid');
    }
    image = new URL(image, window.location);
  } catch (e) {
    // TODO: Dummy image until images are available in index
    image = new URL('https://www.24petwatch.com/content/24petwatch/us/en/blog/gifts-for-dog-lovers-2023.thumb.319.319.png');
  }
  if (title.startsWith('24Petwatch: ')) {
    title = title.replace('24Petwatch: ', '');
  }

  return document.createRange().createContextualFragment(`
    <div>
      <picture>
        <img loading="lazy" alt="${title}" src="${image.toString()}">
      </picture>
    </div>
    <div>
      <h4>${title}</h4>
      <p>${description}</p>
      <p>
        <a href="${path}">Read more</a>
      </p>
    </div>
  `);
}

async function populateBlogTeaser(block) {
  const tags = Array.from(document.head.querySelectorAll('meta[property="article:tag"]')).map((m) => m.getAttribute('content'));
  const response = await fetchBlogPosts(1, tags, 3);
  response.items.forEach((item) => {
    const card = document.createElement('div');
    card.appendChild(createBlogCard(item));
    block.appendChild(card);
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
    // TODO: Do not optimize absolute images for now
    .filter((img) => !(img.src || '').startsWith('http'))
    .forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
