export function doDecoration(block) {
  block.querySelectorAll('H2').forEach((h2) => {
    let nextSibling = h2.nextElementSibling;
    let pCount = 0;
    let wrapperDiv = null;

    while (nextSibling && nextSibling.tagName === 'P') {
      if (pCount % 3 === 0) {
        wrapperDiv = document.createElement('div');
        nextSibling.parentNode.insertBefore(wrapperDiv, nextSibling);
      }
      if (wrapperDiv) {
        wrapperDiv.appendChild(nextSibling);
      }
      nextSibling = wrapperDiv.nextElementSibling;
      pCount += 1;
    }
  });
}

export default async function decorate(block) {
  const content = block.children[0].children[0];
  doDecoration(content);
}
