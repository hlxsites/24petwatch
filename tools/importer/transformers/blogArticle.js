function createBlogArticle(main, document) {
  // Try to remove dts and dds that are not needed
  const dts = document.querySelectorAll('dt');
  const dds = document.querySelectorAll('dd');
  if (dts) {
    for (let i = 0; i < dts.length; i += 1) {
      if (dts[i].textContent === 'Byline') {
        const span = document.createElement('em');
        const authorText = dds[i].textContent.trim();
        span.textContent = authorText;
        dts[i].closest('article').appendChild(span);
      }

      if (dts[i].textContent === 'Text') {
        const div = document.createElement('div');
        div.innerHTML = dds[i].innerHTML;
        dts[i].closest('article').appendChild(div);
        dts[i].remove();
        dds[i].remove();
      }
    }
  }
}

export default createBlogArticle;
