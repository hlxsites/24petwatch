import {
  createOptimizedPicture,
  getMetadata,
  edsBlogDomain,
  isCanada,
  isBlogLocal,
  isLiveSite,
} from '../../scripts/lib-franklin.js';

async function getTagFilters() {
  let index = new URL(`${isCanada ? '/ca' : ''}/blog/tag-filters.json`, window.location.origin);
  if (!isLiveSite) {
    index = new URL(`https://${edsBlogDomain}${isCanada ? '/ca' : ''}/blog/tag-filters.json`);
  }
  const response = await fetch(index);
  const json = await response.json();
  return json.data;
}

async function loadBlogPosts() {
  let index = new URL(`${isCanada ? '/ca' : ''}/blog/query-index.json`, window.location.origin);
  if (!isLiveSite) {
    index = new URL(`https://${edsBlogDomain}${isCanada ? '/ca' : ''}/blog/query-index.json`);
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

  // Filter by tags
  if (tags.length > 0) {
    data = data.filter(({ tags: blogTag }) => tags.some((t) => blogTag.includes(t)));
    total = data.length;
  }

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
    total,
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

  if (!isLiveSite && !isBlogLocal) {
    path = new URL(path, `https://${edsBlogDomain}`).toString();
    try {
      image = new URL(image, `https://${edsBlogDomain}`);
      image.hostname = edsBlogDomain;
    } catch (e) { /* ignore */ }
  } else {
    try {
      image = new URL(image, window.location);
      image.hostname = window.location.hostname;
      image.port = window.location.port;
      image.protocol = window.location.protocol;
    } catch (e) { /* ignore */ }
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

function createSearchBox(block, searchTerm) {
  const onSubmit = (e) => {
    const newSearchTerm = e.target.querySelector('input').value;
    const newUrl = new URL(window.location);
    if (newSearchTerm !== '') {
      newUrl.searchParams.set('search', newSearchTerm);
    } else {
      newUrl.searchParams.delete('search');
    }
    newUrl.searchParams.set('page', 1);
    window.history.pushState({}, '', newUrl.toString());
    e.preventDefault();
    // eslint-disable-next-line no-use-before-define
    decorate(block);
  };

  const searchbar = document.createRange().createContextualFragment(`
    <div class="cards-searchbar">
      <form>
        <label for="search">Search</label>
        <input type="search" id="search" name="search" placeholder="Search blog" value="${searchTerm}">
      </form>
      ${searchTerm ? `<div class="searchbar-results">Search results for "${searchTerm}"</div>` : ''}
    </div>
  `);
  block.closest('.cards-wrapper').prepend(searchbar);
  block.closest('.cards-wrapper').querySelector('.cards-searchbar form').addEventListener('submit', onSubmit);
}

async function createFilterSelect(block, total, currentTag) {
  const tags = await getTagFilters();

  const onChange = (e) => {
    const newUrl = new URL(window.location);
    if (e.target.value !== '') {
      newUrl.searchParams.set('tag', e.target.value);
    } else {
      newUrl.searchParams.delete('tag');
    }
    newUrl.searchParams.set('page', 1);
    window.history.pushState({}, '', newUrl.toString());
    // eslint-disable-next-line no-use-before-define
    decorate(block);
  };

  const filterselect = document.createRange().createContextualFragment(`
    <div class="cards-filterselect">
      <div class="total">${total} Results</div>
      <label for="filter">Filter by:</label>
      <div class="select-group">
        <select id="filter">
          <option value="">Topic</option>
          ${tags.map(({ Name, Value }) => `<option value="${Value}" ${Value === currentTag ? 'selected="selected"' : ''}>${Name}</option>`).join('')}
        </select>
      </div>
    </div>
  `);
  block.closest('.cards-wrapper').insertBefore(filterselect, block.closest('.cards-wrapper').querySelector('.block'));
  block.closest('.cards-wrapper').querySelector('.cards-filterselect select').addEventListener('change', onChange);
}

async function populateBlogTeaser(block) {
  const tags = getMetadata('article:tag').split(', ');
  const related = getMetadata('related').split(', ').map((url) => new URL(url, window.location.origin).pathname);
  let cards = [];
  if (related.length === 0) {
    const response = await fetchBlogPosts(1, tags, '', 3);
    cards = cards.concat(response.items);
  } else {
    const response = await fetchBlogPosts(1, [], '', 200);
    const relatedCards = response.items.filter(({ path }) => related.includes(path));
    cards = cards.concat(relatedCards);
    cards = cards.concat(response.items.slice(0, 3 - relatedCards.length));
  }
  cards.forEach((item) => {
    const card = document.createElement('div');
    card.appendChild(createBlogCard(item));
    block.appendChild(card);
  });
}

async function populateBlogGrid(block) {
  const searchParams = new URLSearchParams(window.location.search);
  const page = parseInt(searchParams.get('page'), 10) || 1;
  const searchTerm = searchParams.get('search') || '';
  const tags = (searchParams.get('tag') ? [searchParams.get('tag')] : []).map((t) => t.replace(/[^a-z0-9-]/g, ''));
  const {
    items, pages, currentPage, total,
  } = await fetchBlogPosts(page, tags, searchTerm.replace(/[^a-zA-Z0-9 ]/g, ''), 9);
  items.forEach((item) => {
    const card = document.createElement('div');
    card.appendChild(createBlogCard(item));
    block.appendChild(card);
  });

  if (items.length === 0) {
    block.closest('.cards-wrapper').prepend(document.createRange().createContextualFragment(`
      <h3>Sorry, there are no results that match your search</h3>
      <p>Please check your spelling or try again using different keywords</p>
    `));
  } else {
    createFilterSelect(block, total, tags.length > 0 ? tags[0] : null);
  }

  createSearchBox(block, searchTerm);
  createPagination(block, pages, currentPage);
}

export default async function decorate(block) {
  const isBlogTeaser = block.classList.contains('blog-teaser');
  if (isBlogTeaser) {
    await populateBlogTeaser(block);
  }

  const isBlogGrid = block.classList.contains('blog-grid');
  if (isBlogGrid) {
    block.textContent = '';
    block.closest('.cards-wrapper').querySelectorAll(':scope > *:not(.block)').forEach((e) => e.remove());
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
        if (h4) {
          wrapInAnchor(h4, href);
        }
      }
    });

    if (li.textContent.trim() !== '') {
      ul.append(li);
    }
  });

  [...ul.querySelectorAll('img')]
    .forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
