import { decorateMain, jsx } from '../../scripts/scripts.js';
import { loadBlocks } from '../../scripts/lib-franklin.js';

function createIdFromText(text) {
  return text.toLowerCase().replace(/\s/g, '-');
}

class Tabs {
  constructor(tabs) {
    this.tabs = tabs;
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
      const resp = await fetch(`${path}.plain.html`);
      if (resp.ok) {
        tabsContainer.innerHTML += jsx`<div id="tab-content-${currentTab}" class="tab-content"></div>`;
        const tabDiv = document.getElementById(`tab-content-${currentTab}`);
        tabDiv.innerHTML = await resp.text();

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
}
