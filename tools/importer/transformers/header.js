const createHeader = async (main, document) => {
  const header = main.querySelector('div.page-header');
  if (header) {
    const logo = document.createElement('span');
    logo.classList.add('icon');
    logo.classList.add('icon-logo');
    logo.textContent = ':logo:';
    main.append(logo);

    main.append(document.createElement('hr'));

    const strong = document.createElement('strong');
    strong.append(document.querySelector('div.page-header__get-quote'));
    main.append(strong);

    main.append(document.createElement('hr'));

    const blog = document.createElement('li');

    const navigationGroup = document.querySelector('ul.cmp-navigation__group');

    // Remove Pet Care
    navigationGroup.children[navigationGroup.children.length - 2].remove();

    // Force append blog to the end of the navigation group
    blog.innerHTML = '<a href="/blog" class="cmp-navigation__item-link">Blog</a>';
    navigationGroup.children[navigationGroup.children.length - 1].before(blog);

    navigationGroup.querySelectorAll('a').forEach((anc) => {
      if (anc.href.includes('/newsletter/wheres-whisker')) {
        anc.closest('li').remove();
      }
    });

    main.append(navigationGroup);

    main.append(document.createElement('hr'));

    const ul = document.createElement('ul');
    const ids = [];
    document.querySelectorAll('div.page-header__notificationBar > div > div').forEach((element) => {
      const link = element.querySelector(':scope > a');

      if (!element.classList.contains('languagenavigation') && !ids.includes(link.id)) {
        const li = document.createElement('li');

        if (link.href === 'https://www.mypethealth.com/') {
          link.textContent = 'Pet Parent Login';
          const additionalLink = document.createElement('li');
          additionalLink.innerHTML = '<a href="https://petpro.my24pet.com/search/home">Pet Professionals Login</a>';
          ul.append(additionalLink);
        }

        ids.push(link.id);
        li.append(link);
        ul.append(li);
      }
    });
    main.append(ul);

    header.innerHTML = '';
  }
};

export default createHeader;
