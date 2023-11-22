function cleanBlog(main, document) {
  // Try to remove dts and dds that are not needed
  const dts = document.querySelectorAll('dt');
  const dds = document.querySelectorAll('dd');
  if (dts) {
    for (let i = 0; i < dts.length; i += 1) {
      dts[i].remove();
      dds[i].remove();
    }
  }
}

export default cleanBlog;
