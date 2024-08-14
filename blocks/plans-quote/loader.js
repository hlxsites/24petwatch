import { jsx } from '../../scripts/scripts.js';

const Loader = {
  loaderWrapper: null,

  addLoader() {
    this.loaderWrapper = document.createElement('div');
    this.loaderWrapper.classList.add('loader-wrapper', 'hide');
    this.loaderWrapper.innerHTML = jsx`
      <div class="loader"></div>
      <div class="loader-txt">Loading</div>
      <div class="loader-bg"></div>
    `;
    document.body.insertBefore(this.loaderWrapper, document.body.firstChild);
  },

  showLoader() {
    if (this.loaderWrapper) {
      this.loaderWrapper.classList.remove('hide');
    }
  },

  hideLoader() {
    if (this.loaderWrapper) {
      this.loaderWrapper.classList.add('hide');
    }
  },
};

export default Loader;
