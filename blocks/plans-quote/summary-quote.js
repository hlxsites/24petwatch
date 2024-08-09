import { jsx } from '../../scripts/scripts.js';
import { isCanada } from '../../scripts/lib-franklin.js';
import APIClient from '../../scripts/24petwatch-api.js';
import {
  COOKIE_NAME_SAVED_OWNER_ID,
  COOKIE_NAME_FOR_PET_PLANS,
  PET_PLANS_LPM_URL,
  PET_PLANS_LPM_PLUS_URL,
  PET_PLANS_ANNUAL_URL,
  getCookie,
  getCombinedCookie, PET_PLANS_SUMMARY_QUOTE_URL,
} from '../../scripts/24petwatch-utils.js';

export default async function decorateSummaryQuote(block, apiBaseUrl) {
  // initialize form based on results from the previous step
  const APIClientObj = new APIClient(apiBaseUrl);

  const ownerId = getCookie(COOKIE_NAME_SAVED_OWNER_ID);

  let ownerData = [];
  let petsList = [];
  let selectedProducts = [];

  try {
    ownerData = await APIClientObj.getOwner(ownerId);
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the owner:', ownerId, ' status:', status);
  }

  console.dir(ownerData);

  if (ownerData.id) {
    try {
      petsList = await APIClientObj.getPets(ownerData.id);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the pets for owner:', ownerData.id, ' status:', status);
    }

    try {
      selectedProducts = await APIClientObj.getSelectedProductsForOwner(ownerData.id);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the selected products for owner:', ownerData.id, ' status:', status);
    }
  }

  console.dir(petsList);
  console.dir(selectedProducts);

  function getSelectedProduct(petId) {
    return selectedProducts.find((item) => item.petID === petId);
  }

  function getSelectedProductAdditionalInfo(itemId) {
    const additionalInfo = {
      PLH_000007: {
        name: 'Lifetime Protection Membership™',
        priceComment: '(A one-time fee)',
        pageLink: PET_PLANS_LPM_URL,
      },
      'LPM-PLUS': {
        name: 'Lifetime Protection Membership™ Plus',
        priceComment: '(A one-time fee)',
        pageLink: PET_PLANS_LPM_PLUS_URL,
      },
      'Annual Plan-DOGS': {
        name: 'Annual Protection Membership',
        priceComment: 'FOR THE FIRST YEAR $19.95/YEAR THEREAFTER',
        pageLink: PET_PLANS_ANNUAL_URL,
      },
      'Annual Plan-CATS': {
        name: 'Annual Protection Membership',
        priceComment: 'FOR THE FIRST YEAR $19.95/YEAR THEREAFTER',
        pageLink: PET_PLANS_ANNUAL_URL,
      },
    };

    return additionalInfo[itemId] || '';
  }

  // eslint-disable-next-line no-shadow
  async function getPurchaseSummary(ownerId) {
    let purchaseSummary = {};
    try {
      purchaseSummary = await APIClientObj.getPurchaseSummary(ownerId);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the purchase summary for owner:', ownerId, ' status:', status);
    }

    return purchaseSummary;
  }

  function editPet(petId) {
    window.location.href = `.${getSelectedProductAdditionalInfo(getSelectedProduct(petId).itemId).pageLink}?petId=${petId}`;
  }

  function removePet(petId) {
    console.log('Remove pet:', petId);
  }

  function getAutoRenewTet(itemId) {
    if (itemId === 'Annual Plan-DOGS' || itemId === 'Annual Plan-CATS') {
      return jsx`
      <strong>Your Annual Membership will automatically renew on your renewal date which is one year from today. The renewal rate is currently $19.95, plus applicable taxes (price is subject to change).</strong>
      `;
    }

    return jsx`
    <strong>Auto-renew your 24PetMedAlert® and 24/7 Vet Helpline subscriptions to keep enjoying these benefits once your complimentary access expires after 1 year:</strong><br />
    <ul>
        <li>Critical medical and behavioral information will be relayed to the shelter or vet they're brought to when found</li>
        <li>Anytime access to veterinary professionals through live chat, email or by phone</li>
    </ul>
    `;
  }

  function getInfoHTML(itemId) {
    if (itemId === 'Annual Plan-DOGS' || itemId === 'Annual Plan-CATS') {
      return '';
    }

    return jsx`
    <div class="auto-renew-info">
        <div class="auto-renew-info-text">As part of the Lifetime Protection Membership, these two benefits are free for the first year. Renew them together for just $19.95 per year (plus applicable taxes. Price is subject to change). Your credit card will be charged on your renewal date, which is one year from today.</div>
    </div>
    `;
  }

  const petListHTML = petsList.map((pet) => {
    const selectedProduct = getSelectedProduct(pet.id);
    return jsx`
    <div class="item">
        <div class="item-header">
            <p>${getSelectedProductAdditionalInfo(selectedProduct.itemId).name}</p>
            <div class="item-menu">
                <a data-pet-id="${pet.id}" class="edit-pet">Edit</a>
                <a data-pet-id="${pet.id}" class="remove-pet">Remove</a>
            </div>
        </div>
        <div class="item-info">
            <div class="item-info-header">
              <div class="pet-name">${pet.petName}<span></span></div>
              <div class="price-info">
                <div class="price">$${selectedProduct.salesPrice}</div>
                <div class="price-comment">${getSelectedProductAdditionalInfo(selectedProduct.itemId).priceComment}</div>
              </div>
            </div>
        </div>
        <div class="auto-renew">
            <div class="auto-renew-checkbox-container"><input type="checkbox" class="auto-renew-checkbox" data-rec-id="${selectedProduct.quoteRecId}" data-pet-id="${selectedProduct.petID}" ${selectedProduct.autoRenew ? ' checked' : ''} /></div>
            <div class="auto-renew-text">${getAutoRenewTet(selectedProduct.itemId)}</div>
            ${getInfoHTML(selectedProduct.itemId)}
        </div>
    </div>
    `;
  });

  block.innerHTML = jsx`
  <dialog id="confirmation-dialog">
    <h3 id="confirmation-dialog-header"></h3>
    <p id="confirmation-dialog-note"></p>
    <div class="dialog-buttons-container">
      <button type="button" class="yes" id="confirmation-dialog-yes">Yes</button>
      <button type="button" class="no" id="confirmation-dialog-no" autofocus>No</button>
    </div>
  </dialog>
  ${petListHTML}
  `;

  console.log(await getPurchaseSummary(ownerData.id));

  const confirmationDialog = document.getElementById('confirmation-dialog');
  const confirmationDialogHeader = document.getElementById('confirmation-dialog-header');
  const confirmationDialogNote = document.getElementById('confirmation-dialog-note');
  const confirmationDialogYes = document.getElementById('confirmation-dialog-yes');
  const confirmationDialogNo = document.getElementById('confirmation-dialog-no');

  function editPetHandler(petID) {
    confirmationDialogHeader.textContent = 'Edit Confirmation';
    confirmationDialogNote.textContent = 'Please note: If you edit the information, the system will return you to the beginning of the order process.';
    confirmationDialog.showModal();
    confirmationDialogYes.onclick = () => {
      confirmationDialog.close();
      editPet(petID);
    };
    confirmationDialogNo.onclick = () => {
      confirmationDialog.close();
    };
  }

  function removePetHandler(petID) {
    confirmationDialogHeader.textContent = 'Remove Confirmation';
    confirmationDialogNote.textContent = 'Are you sure you want to remove this pet from your order? All associated products will be removed.';
    confirmationDialog.showModal();
    confirmationDialogYes.onclick = () => {
      confirmationDialog.close();
      removePet(petID);
    };
    confirmationDialogNo.onclick = () => {
      confirmationDialog.close();
    };
  }

  const itemsContainer = document.querySelector('.summary-quote');
  itemsContainer.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('edit-pet')) {
      const petID = event.target.getAttribute('data-pet-id');
      editPetHandler(petID);
    } else if (event.target && event.target.classList.contains('remove-pet')) {
      const petID = event.target.getAttribute('data-pet-id');
      removePetHandler(petID);
    }
  });
}
