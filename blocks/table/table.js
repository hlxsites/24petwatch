/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function isHeaderCell(cell) {
  return cell.nodeName === 'TH';
}

function isCheckmark(str) {
  return str === '✓';
}

function warpStrWithITag(cell, str) {
  if (!isHeaderCell(cell) && isCheckmark(str)) {
    return `<i>${str}</i>`;
  }

  return str;
}

function addMostPopular(cell, col) {
  const pElement = col.querySelector('p');
  if (pElement && isCheckmark(pElement.innerHTML)) {
    col.removeChild(pElement);
    cell.classList.add('most-popular');
  }
}

function addInfoBlock(cell) {
  const [coverage, information] = cell.innerHTML.split('---');

  if (information) {
    let result = '';
    const divInfoIcon = document.createElement('div');
    const divInfoContent = document.createElement('div');
    divInfoIcon.classList.add('info-icon');
    divInfoContent.classList.add('info-content');
    divInfoContent.innerHTML = information;
    divInfoIcon.innerHTML = divInfoContent.outerHTML;
    result = coverage + divInfoIcon.outerHTML;

    cell.innerHTML = result;
  }
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  if (header) {
    table.append(thead);
  }
  table.append(tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col, j) => {
      const cell = buildCell(header ? i : i + 1);
      if (isHeaderCell(cell)) {
        addMostPopular(cell, col);
      }
      cell.innerHTML = warpStrWithITag(cell, col.innerHTML);
      if (j === 0) {
        addInfoBlock(cell);
      }
      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);
}
