import { loadFragment } from '../fragment/fragment.js';
import { jsx } from '../../scripts/scripts.js';

function createIdFromText(text) {
  return text.toLowerCase().replace(/\s/g, '-');
}

function prepareFragmentURL(path) {
  if (path.startsWith('/')) {
    return path;
  }

  return window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + path;
}

function getURLHash() {
  return window.location.hash.substring(1);
}

class Tabs {
  constructor(tabs) {
    this.tabs = tabs;
  }

  async loadTab() {
    let tabContent = '';
    let currentTab = getURLHash();
    const tabContentDiv = document.getElementById('tab-content');

    if (!this.tabs[currentTab]) {
      [currentTab] = Object.keys(this.tabs);
    }

    document.querySelectorAll('.tabs-menu a').forEach((a) => a.classList.remove('current'));
    const currentLink = document.querySelector(`.tabs-menu a[href="#${currentTab}"]`);
    if (currentLink) {
      currentLink.classList.add('current');
    }

    document.querySelectorAll('.tab-content').forEach((div) => {
      div.style.display = 'none';
    });

    const currentTabContent = document.getElementById(`tab-content-${currentTab}`);

    if (currentTabContent) {
      currentTabContent.style.display = 'block';
    } else {
      const fragment = await loadFragment(prepareFragmentURL(this.tabs[currentTab].fragment));
      tabContent = fragment.innerHTML;

      tabContentDiv.innerHTML += jsx`<div id="tab-content-${currentTab}" class="tab-content">${tabContent}</div>`;
    }
  }
}

export default async function decorate(block) {
  const tabsList = {};

  [...block.children].forEach((row) => {
    tabsList[createIdFromText(row.children[0].textContent)] = {
      title: row.children[0].textContent,
      fragment: row.children[1].textContent,
    };
  });

  const tabs = new Tabs(tabsList);

  block.innerHTML = jsx`
    <div class="tabs-menu">
      <ul>
        ${Object.keys(tabsList).map((tab) => jsx`
          <li>
            <a href="#${tab}">${tabsList[tab].title}</a>
          </li>
        `).join('')}
      </ul>
    </div>
    <div id="tab-content" class="tabs-content"></div>
  `;

  await tabs.loadTab();

  window.addEventListener('hashchange', () => {
    tabs.loadTab();
  }, false);
}
