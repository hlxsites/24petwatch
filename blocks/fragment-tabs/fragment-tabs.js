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

  // Prepare the URL for the fragment.
  // Fragment pages are stored in the same directory as the main page.
  static prepareFragmentURL(path) {
    let currentPath = window.location.pathname;
    currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const newPath = path.startsWith('/') ? path : `/${path}`;

    return currentPath + newPath;
  }

  async preloadTabs() {
    const currentTab = Tabs.getURLHash() || Object.keys(this.tabs)[0];
    const fetchPromises = Object.entries(this.tabs)
      .filter(([tab]) => tab !== currentTab) // Skip the current tab
      .map(async ([tab, details]) => {
        const path = Tabs.prepareFragmentURL(details.fragment);
        const resp = await fetch(`${path}.plain.html`);
        if (resp.ok) {
          this.preloadedContent[tab] = await resp.text();
          await Tabs.createTabContent(tab, this.preloadedContent[tab], path);
        }
      });

    return Promise.all(fetchPromises);
  }

  static async createTabContent(tab, content, path) {
    const tabsContainer = document.getElementById('tab-content');
    tabsContainer.innerHTML += jsx`<div id="tab-content-${tab}" class="tab-content" style="display: none;">${content}</div>`;
    const tabDiv = document.getElementById(`tab-content-${tab}`);

    // Reset base path for media to fragment base
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

  async loadTab() {
    // const tabsContainer = document.getElementById('tab-content');
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
      let content = this.preloadedContent[currentTab]; // Check for preloaded content first
      if (!content) { // If not preloaded, fetch the content
        const resp = await fetch(`${path}.plain.html`);
        if (resp.ok) {
          content = await resp.text();
        }
        // We need to preload other tabs so LazyLoad can assign event listeners correctly
        await this.preloadTabs();
      }
      if (content) {
        this.preloadedContent[currentTab] = content;
        await Tabs.createTabContent(currentTab, content, path);
        const tabDiv = document.getElementById(`tab-content-${currentTab}`);
        tabDiv.style.display = 'block';
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
}
