export default async function decorate(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      if (row.children[0].textContent && row.children[1].textContent) {
        config[row.children[0].textContent.toLowerCase()] = row.children[1].textContent;
      }
    }
  });

  const { host } = config;
  const lang = config.lang || 'en';
  const src = `https://www.trustedsite.com/verify-modal?js=1&host=${host}&lang=${lang}`;

  block.innerHTML = '';
  const formContent = `
    <div class="trustedsite-trustmark-wrapper">
      <div id="trustedsite-trustmark"></div>
    </div>
  `;

  const fragment = document.createRange().createContextualFragment(formContent);
  block.appendChild(fragment);

  const trustedsiteTrustmark = document.querySelector('#trustedsite-trustmark');
  trustedsiteTrustmark.addEventListener('click', () => {
    // Create the modal container
    const modalDiv = document.createElement('div');
    modalDiv.setAttribute('id', 'trustedsite-tm-verify');
    modalDiv.setAttribute('title', 'TrustedSite Certified');

    // Create the iframe element
    const iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'trustedsite-iframe');
    iframe.setAttribute('src', src);

    // Create the overlay div
    const overlayDiv = document.createElement('div');
    overlayDiv.setAttribute('id', 'trustedsite-tm-overlay');

    document.body.appendChild(overlayDiv);
    modalDiv.appendChild(iframe);
    document.body.appendChild(modalDiv);

    // Add a close button
    const closeButton = document.createElement('div');
    closeButton.setAttribute('id', 'trustedsite-tm-close');

    closeButton.addEventListener('click', () => {
      document.body.removeChild(modalDiv);
      document.body.removeChild(overlayDiv);
    });

    modalDiv.appendChild(closeButton);

    // Close the modal when the overlay is clicked
    overlayDiv.addEventListener('click', () => {
      document.body.removeChild(modalDiv);
      document.body.removeChild(overlayDiv);
    });
  });
}
