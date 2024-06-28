import { decorateMain, jsx } from '../../scripts/scripts.js';
import { loadBlocks } from '../../scripts/lib-franklin.js';

function createIdFromText(text) {
  return text.toLowerCase().replace(/\s/g, '-');
}

class Tabs {
  constructor(tabs) {
    this.tabs = tabs;
    this.preloadedContent = {}; // Object to store preloaded content
  }

  static getURLHash() {
    return window.location.hash.substring(1);
  }

  static prepareFragmentURL(path) {
    if (path.startsWith('/')) {
      return path;
    }
    return window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + path;
  }

  preloadTabs() {
    const currentTab = Tabs.getURLHash() || Object.keys(this.tabs)[0];
    const fetchPromises = Object.entries(this.tabs)
      .filter(([tab]) => tab !== currentTab) // Skip the current tab
      .map(async ([tab, details]) => {
        const path = Tabs.prepareFragmentURL(details.fragment);
        const resp = await fetch(`${path}.plain.html`);
        if (resp.ok) {
          this.preloadedContent[tab] = await resp.text();
        }
      });

    return Promise.all(fetchPromises);
  }

  async loadTab() {
    const tabsContainer = document.getElementById('tab-content');
    let currentTab = Tabs.getURLHash();

    if (!this.tabs[currentTab]) {
      [currentTab] = Object.keys(this.tabs);
    }

    const path = Tabs.prepareFragmentURL(this.tabs[currentTab].fragment);

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
      let content;
      if (this.preloadedContent[currentTab]) {
        content = this.preloadedContent[currentTab];
      } else {
        const resp = await fetch(`${path}.plain.html`);
        if (resp.ok) {
          content = await resp.text();
        }
      }
      if (content) {
        tabsContainer.innerHTML += jsx`<div id="tab-content-${currentTab}" class="tab-content">${content}</div>`;
        const tabDiv = document.getElementById(`tab-content-${currentTab}`);

        // reset base path for media to fragment base
        const resetAttributeBase = (tag, attr) => {
          tabDiv.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
            elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
          });
        };
        resetAttributeBase('img', 'src');
        resetAttributeBase('source', 'srcset');

        decorateMain(tabDiv);
        await loadBlocks(tabDiv);
      }
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tabs.preloadTabs();
    });
  } else {
    // DOMContentLoaded has already fired
    tabs.preloadTabs();
  }
}
