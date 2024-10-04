import { jsx } from '../../scripts/scripts.js';
import APIClient from '../../scripts/24petwatch-api.js';
import Loader from './loader.js';
import formDecoration from './form.js';
import {
  COOKIE_NAME_SAVED_OWNER_ID,
  getCookie,
  getSelectedProductAdditionalInfo,
  getItemInfoFragment,
} from '../../scripts/24petwatch-utils.js';

export default async function decorateSummaryQuote(block, apiBaseUrl) {
  // initialize form based on results from the previous step
  const APIClientObj = new APIClient(apiBaseUrl);
  Loader.addLoader();

  const ownerId = getCookie(COOKIE_NAME_SAVED_OWNER_ID);

  let ownerData = [];
  let petsList = [];
  let selectedProducts = [];
  let purchaseSummary = {};
  let totalShipping = 0;

  // eslint-disable-next-line no-shadow
  async function getPurchaseSummary(ownerId) {
    Loader.showLoader();
    // eslint-disable-next-line no-shadow
    let purchaseSummary = {};
    try {
      purchaseSummary = await APIClientObj.getPurchaseSummary(ownerId);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the purchase summary for owner:', ownerId, ' status:', status);
    }
    Loader.hideLoader();

    return purchaseSummary;
  }

  Loader.showLoader();
  try {
    ownerData = await APIClientObj.getOwner(ownerId);
  } catch (status) {
    // eslint-disable-next-line no-console
    console.log('Failed to get the owner:', ownerId, ' status:', status);
  }

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

    try {
      purchaseSummary = await getPurchaseSummary(ownerData.id);

      totalShipping = purchaseSummary.petSummaries.reduce((sum, pet) => {
        const shipping = pet.nonInsurancePetSummary?.shipping || 0;
        return sum + shipping;
      }, 0);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to get the purchase summary for owner:', ownerData.id, ' status:', status);
    }
  }
  Loader.hideLoader();

  function getSelectedProduct(petId) {
    return selectedProducts.find((item) => item.petID === petId);
  }

  function editPet(petId) {
    window.location.href = `.${getSelectedProductAdditionalInfo(getSelectedProduct(petId).itemId).pageLink}?petId=${petId}`;
  }

  async function removePet(petId) {
    Loader.showLoader();
    try {
      await APIClientObj.deletePet(petId);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to delete the pet:', petId, ' status:', status);
    }
    Loader.hideLoader();
    window.location.reload();
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
    if (!selectedProduct) {
      return '';
    }
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
              <div class="pet-name">${pet.petName}<span class="item-info-fragment-button" data-pet-id="${pet.id}"></span></div>
              <div class="price-info">
                <div class="price">$${selectedProduct.salesPrice}</div>
                <div class="price-comment">${getSelectedProductAdditionalInfo(selectedProduct.itemId).priceComment}</div>
              </div>
            </div>
            <div class="item-info-fragment" id="item-info-fragment-${pet.id}" data-selected-product-id="${selectedProduct.itemId}"></div>
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
  ${petListHTML.join('')}
  <div class="new-pet-form">
    <div class="new-pet-form-header">
      <span>Add Another Pet</span>
      <span id="add-another-pet">Add</span>
    </div>
    <div id="form-wrapper"></div>
  </div>
  <div class="payment-summary">
    <h5>Payment Summary</h5>
    <div class="payments">
        ${purchaseSummary.summary.discount ? `<div><div>Discount</div><div>-$${purchaseSummary.summary.discount}</div></div>` : ''}
        <div>
            <div>Monthly Fee</div>
            <div>$0.00</div>
        </div>
        ${(totalShipping > 0) ? `<div><div>Shipping of Tag</div><div>$${totalShipping.toFixed(2)}</div></div>` : ''}
        <div>
            <div>Subtotal</div>
            <div>$${purchaseSummary.summary.subTotal}</div>
        </div>
        <div>
            <div>Sales Tax</div>
            <div>$${purchaseSummary.summary.salesTaxes}</div>
        </div>
        <div class="due-today">
            <div>Due Today</div>
            <div>$${purchaseSummary.summary.totalDueToday}</div>
        </div>
    </div>
  </div>
  <div class="bottom-section">
    <div class="amount-info">This amount will appear as PTZ*24PTWTCH* on your credit card or bank statement.</div>
    <button id="proceedToPayment">Proceed to Payment</button>
  </div>
  `;

  // Loading item info fragments
  const itemInfoFragmets = document.querySelectorAll('.item-info-fragment');
  itemInfoFragmets.forEach((infoFragments) => {
    const itemId = infoFragments.getAttribute('data-selected-product-id');
    getItemInfoFragment(itemId).then((fragment) => {
      infoFragments.append(fragment);
    });
  });

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

  async function updateAutoRenewHandler(target) {
    Loader.showLoader();
    const petID = target.getAttribute('data-pet-id');
    const recID = target.getAttribute('data-rec-id');
    const isChecked = target.checked;
    try {
      await APIClientObj.saveSelectedProduct(petID, recID, 1, isChecked);
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to update the auto-renew for pet:', petID, ' status:', status);
    }
    Loader.hideLoader();
  }

  function itemInfoFragmentButtonHandler(target) {
    const petID = target.getAttribute('data-pet-id');
    const itemInfoFragment = document.getElementById(`item-info-fragment-${petID}`);
    itemInfoFragment.classList.toggle('show');
    target.classList.toggle('up');
  }

  const itemsContainer = document.querySelector('.summary-quote');
  itemsContainer.addEventListener('click', (event) => {
    switch (true) {
      case event.target.classList.contains('edit-pet'):
        editPetHandler(event.target.getAttribute('data-pet-id'));
        break;
      case event.target.classList.contains('remove-pet'):
        removePetHandler(event.target.getAttribute('data-pet-id'));
        break;
      case event.target.classList.contains('auto-renew-checkbox'):
        updateAutoRenewHandler(event.target);
        break;
      case event.target.classList.contains('item-info-fragment-button'):
        itemInfoFragmentButtonHandler(event.target);
        break;
      default:
        break;
    }
  });

  const proceedToPaymentButton = document.getElementById('proceedToPayment');

  function replaceUrlPlaceholders(urlTemplate, ...values) {
    return urlTemplate.replace(
      /{(\d+)}/g,
      (match, index) => (typeof values[index] !== 'undefined' ? values[index] : match),
    );
  }

  proceedToPaymentButton.onclick = async () => {
    try {
      const data = await APIClientObj.postSalesForPayment(ownerData.id, ownerData.cartFlow);
      if (data.isSuccess) {
        window.location.href = replaceUrlPlaceholders(
          data.paymentProcessorRedirectBackURL,
          data.paymentProcessingUserId,
          'protectionfirst',
          ownerData.id,
        );
      }
    } catch (status) {
      // eslint-disable-next-line no-console
      console.log('Failed to post sales for payment for owner:', ownerData.id, ' status:', status);
    }
  };

  const addPetButton = document.getElementById('add-another-pet');
  const formWrapper = document.getElementById('form-wrapper');

  addPetButton.onclick = () => {
    if (formWrapper.innerHTML === '') {
      formDecoration(formWrapper, apiBaseUrl);
    } else {
      formWrapper.innerHTML = '';
    }
  };
}
