export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }

      const pElements = col.querySelectorAll('p');
      pElements.forEach((p) => {
        const match = p.textContent.match(/---iframe---(.*?)---iframe---/);
        if (match) {
          const iframeSrc = match[1];
          const iframe = document.createElement('iframe');
          iframe.setAttribute('src', iframeSrc);
          iframe.style.width = '100%';
          iframe.style.height = '500px';
          iframe.style.border = 'none';
          p.replaceWith(iframe);
        }
      });
    });
  });
}
