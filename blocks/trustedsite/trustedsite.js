// "Certified Secure" certification by TrustedSite.com
// Display the TrustedSite trustmark in iframe modal
export default async function decorate(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [keyElement, valueElement] = row.children;
    if (keyElement?.textContent && valueElement?.textContent) {
      config[keyElement.textContent.toLowerCase()] = valueElement.textContent;
    }
  });

  const { host } = config;
  const lang = config.lang || 'en';
  const src = `https://www.trustedsite.com/verify-modal?js=1&host=${host}&lang=${lang}`;

  block.innerHTML = '';
  const blockContent = `
    <div id="trustedsite-trustmark-wrapper">
      <div id="trustedsite-trustmark"></div>
    </div>
  `;

  const fragment = document.createRange().createContextualFragment(blockContent);
  block.appendChild(fragment);

  const trustedsiteTrustmark = document.querySelector('#trustedsite-trustmark');

  // Set the background image dynamically based on the lang value
  trustedsiteTrustmark.style.backgroundImage = `url('https://cdn.ywxi.net/meter/24petwatch.com/202.svg?l=${lang}')`;

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
