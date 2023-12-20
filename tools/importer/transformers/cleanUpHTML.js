function cleanUpHTML(main, document) {
  // to remove /content/24petwatch/us/en' from internal URL
  main.querySelectorAll('a').forEach((anc) => {
    anc.href = anc.href.replace('/content/24petwatch/us/en', '');
    anc.href = anc.href.replace('/content/24petwatch/language-masters/en', '');
    anc.href = anc.href.replace('/content/24petwatch/ca/en', '/ca');
  });

  main.querySelectorAll('span.cmp-text--largetext').forEach((e) => {
    e.outerHTML = `<b>${e.textContent}</b>`;
  });

  main.querySelectorAll('div.cmp-text-specialfineprint ').forEach((e) => {
    e.outerHTML = `<em>${e.textContent}</em>`;
  });

  main.querySelectorAll('div.button').forEach((e) => {
    const importedLink = e.querySelector('a');
    const buttonType = importedLink.getAttribute('href').startsWith('https://')
      ? 'em'
      : 'strong';
    const cta = document.createElement('a');
    const button = document.createElement(buttonType);
    cta.setAttribute('href', importedLink.getAttribute('href'));
    cta.textContent = importedLink.textContent;
    button.append(cta);
    e.outerHTML = button.outerHTML;
  });

  const img = main.querySelector('body > div:first-child > img');
  if (img) {
    img.remove();
  }

  return main;
}

export default cleanUpHTML;
