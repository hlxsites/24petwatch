import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

function wrapInAnchor(element, href) {
  const anchor = document.createElement('a');
  anchor.classList.add('wrapping-anchor');
  anchor.href = href;
  element.replaceWith(anchor);
  anchor.appendChild(element);
}

export default function decorate(block) {
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
      }

      else {
        div.className = 'cards-card-body';
        const h4 = li.querySelector('h4');
        wrapInAnchor(h4, href);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
