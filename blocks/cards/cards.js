import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';

const isCanada = window.location.pathname.startsWith('/ca/');

async function loadBlogPosts() {
  let index = new URL(`${isCanada ? '/ca' : ''}/blog/query-index.json`, window.location.origin);
  if (!window.location.hostname.includes('24petwatch.com')) {
    index = new URL(`https://main--24petwatch--hlxsites.hlx.live${isCanada ? '/ca' : ''}/blog/query-index.json`);
  }
  const chunkSize = 100;
  const loadChunk = async (offset) => {
    index.searchParams.set('limit', chunkSize);
    index.searchParams.set('offset', offset);

    const response = await fetch(index);
    const json = await response.json();

    // Check if more has to be loaded
    if (json.total > offset + chunkSize) {
      return {
        data: [...json.data, ...(await loadChunk(offset + 100)).data],
        total: json.total,
      };
    }
    return {
      data: json.data,
      total: json.total,
    };
  };

  if (!window.blogPosts) {
    window.blogPosts = await loadChunk(0);
  }
  return window.blogPosts;
}

// eslint-disable-next-line no-unused-vars
const fetchBlogPosts = async (page = 1, tags = [], searchTerm = '', pagesize = 9) => {
  let { data, total } = await loadBlogPosts();

  // TODO filter by tags

  // Filter by search term
  if (searchTerm) {
    data = data
      .filter(({ title, description }) => title.toLowerCase().includes(searchTerm.toLowerCase())
        || description.toLowerCase().includes(searchTerm.toLowerCase()));
    total = data.length;
  }

  // Filter by page
  const start = (page - 1) * pagesize;
  const end = start + pagesize;

  let currentPage = page;
  if (currentPage > Math.ceil(total / pagesize)) {
    currentPage = Math.ceil(total / pagesize);
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  return {
    items: data.slice(start, end),
    pages: Math.ceil(total / pagesize),
    currentPage,
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

function createPagination(block, pages, currentPage) {
  let pageSet = new Set([1, pages, currentPage, currentPage - 1, currentPage + 1]);
  pageSet = Array.from(pageSet)
    .filter((a) => a > 0 && a <= pages)
    .sort((a, b) => a - b);

  const onPaginate = (e) => {
    const hrefPage = parseInt(new URL(e.target.href).searchParams.get('page'), 10);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('page', hrefPage);
    window.history.pushState({}, '', newUrl.toString());
    e.preventDefault();
    // eslint-disable-next-line no-use-before-define
    decorate(block);
  };

  const pagination = document.createRange().createContextualFragment(`
    <div class="cards-pagination">
      <ul>
        ${currentPage > 1 ? `<li class="prev"><a href="?page=${currentPage - 1}">Prev</a></li>` : ''}
        ${pageSet.map((p, index) => {
    const item = index > 0 && p - pageSet[index - 1] > 1 ? '<li class="dots">...</li>' : '';
    return `${item}<li class="${p === currentPage ? 'active' : ''}"><a href="?page=${p}">${p}</a></li>`;
  }).join('')}
        ${currentPage < pages ? `<li class="next"><a href="?page=${currentPage + 1}">Next</a></li>` : ''}
      </ul>
    </div>`);
  block.closest('.cards-wrapper').appendChild(pagination);
  block.closest('.cards-wrapper').querySelectorAll('.cards-pagination a').forEach((a) => a.addEventListener('click', onPaginate));
}

async function populateBlogTeaser(block) {
  const tags = getMetadata('article:tag').split(', ');
  const response = await fetchBlogPosts(1, tags, '', 3);
  response.items.forEach((item) => {
    const card = document.createElement('div');
    card.appendChild(createBlogCard(item));
    block.appendChild(card);
  });
}

async function populateBlogGrid(block) {
  const searchParams = new URLSearchParams(window.location.search);
  const page = parseInt(searchParams.get('page'), 10) || 1;
  const searchTerm = searchParams.get('search') || '';
  const { items, pages, currentPage } = await fetchBlogPosts(page, [], searchTerm.replace(/[^a-zA-Z0-9 ]/g, ''), 9);
  items.forEach((item) => {
    const card = document.createElement('div');
    card.appendChild(createBlogCard(item));
    block.appendChild(card);
  });

  // TODO: Display search box
  // TODO: Filter by tags
  createPagination(block, pages, currentPage);
}

export default async function decorate(block) {
  // TODO: Clean
  const isBlogTeaser = block.classList.contains('blog-teaser');
  if (isBlogTeaser) {
    await populateBlogTeaser(block);
  }

  const isBlogGrid = block.classList.contains('blog-grid');
  if (isBlogGrid) {
    block.textContent = '';
    block.closest('.cards-wrapper').querySelector('.cards-pagination')?.remove();
    await populateBlogGrid(block);
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
