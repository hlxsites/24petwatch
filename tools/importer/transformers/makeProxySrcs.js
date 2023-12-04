function makeProxySrcs(main, document, host = 'https://www.24petwatch.com') {
  main.querySelectorAll('img').forEach((img) => {
    if (img.src.startsWith('//')) {
      img.src = `https:${img.src}`;
    } else if (img.src.startsWith('/')) {
      // make absolute
      const cu = new URL(host);
      img.src = `${cu.origin}${img.src}`;
    }
    try {
      const u = new URL(img.src);
      u.searchParams.append('host', u.origin);
      img.src = `http://localhost:3001${u.pathname}${u.search}`;
    } catch (error) {
      console.warn(`Unable to make proxy src for ${img.src}: ${error.message}`);
    }
  });
};

export default makeProxySrcs;
