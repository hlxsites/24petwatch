import { getConfigValue } from './configs.js';

let API_BASE_URL = null;
export async function getAPIBaseUrl() {
  if (!API_BASE_URL) {
    API_BASE_URL = await getConfigValue('pethealth-proxy', '');
  }
  return API_BASE_URL;
}

// ----- misc helpers -----

// ensure the value is a boolean
function asBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  return (value === 'true');
}

// ensure the value is an integer
function asInt(value) {
  return parseInt(value, 10);
}

export default class APIClient {
  static METHOD_GET = 'GET';

  static METHOD_PUT = 'PUT';

  static METHOD_POST = 'POST';

  static METHOD_DELETE = 'DELETE';

  constructor(basePath) {
    // note: you can use the getAPIBaseUrl() function to get this value
    this.basePath = basePath;
  }

  static callAPI(url, method, params, data, done, fail, type) {
    const options = { method };
    let urlWithParams = url; // might remain as the original URL if no params are provided
    if (params) {
      // note: the 24PetWatch sometimes uses params for a POST or PUT request, instead of data
      const urlSearchParams = new URLSearchParams(params).toString();
      urlWithParams += `?${urlSearchParams}`;
    }
    if (data || method === APIClient.METHOD_POST || method === APIClient.METHOD_PUT) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }
    if (data) {
      const payload = { payload: data };
      options.body = JSON.stringify(payload);
    }

    fetch(urlWithParams, options)
      .then((response) => {
        if (!response.ok) {
          throw response;
        }

        if (type === 'json') {
          return response.json();
        } if (type === 'text') {
          return response.text();
        }
        return response.blob();
      })
      .then((responseData) => {
        done(responseData);
      })
      .catch((response) => {
        fail(response.status);
      });
  }

  getBreeds(speciesId, purebreed, done, fail) {
    const path = 'Utility/GetBreeds';
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, { speciesId, purebreed }, null, done, fail, 'json');
  }

  validateNonInsurancePromoCodeWithSpecies(promoCode, countryId, speciesId, done, fail) {
    const path = 'Product/ValidateNonInsurancePromoCodeWithSpecies';
    const params = {
      promoCode,
      country: countryId,
    };
    if (speciesId) {
      params.species = speciesId;
    }
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, params, null, done, fail, 'json');
  }

  getCountryStates(zipCode, done, fail) {
    const path = 'Utility/GetCountryState';
    APIClient.callAPI(`${this.basePath}/${path}/${zipCode}`, APIClient.METHOD_GET, null, null, done, fail, 'json');
  }

  /** Creates or Updates an owner, depending on whether the ownerId is provided.
   * @param ownerId - if provided, the owner will be updated, otherwise a new owner will be created
   * @param email
   * @param zipCode
   * @param cartFlow
   * @returns {Promise<unknown>} - resolves with the owner data
   */
  saveOwner(ownerId, email, zipCode, cartFlow) {
    const ownerAlreadyExists = (ownerId !== '');
    const method = (ownerAlreadyExists) ? 'PUT' : 'POST';
    const path = (ownerAlreadyExists) ? `Owner/${ownerId}` : 'Owner';
    const data = {
      email,
      zipCode,
      cartFlow,
      partnerID: 84, // hardcoded
      referralURL: '',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      homePhone: '',
      remoteHost: '',
    };
    return new Promise((resolve, reject) => {
      APIClient.callAPI(`${this.basePath}/${path}`, `${method}`, null, data, resolve, reject, 'json');
    });
  }

  /** Creates or Updates a pet, depending on whether the petId is provided.
   * @param petId - if provided, the pet will be updated, otherwise a new pet will be created
   * @param ownerId - string
   * @param petName - string
   * @param breedId - string (like '1234567890')
   * @param speciesId - integer (1 = Dog, 2 = Cat)
   * @param isPureBreed - boolean (true = Pure Breed, false = Mixed Breed)
   * @param microchipId - string
   * @returns {Promise<unknown>} - resolves with the pet data
   */
  savePet(petId, ownerId, petName, breedId, speciesId, isPureBreed, microchipId) {
    const pureBreed = asBoolean();

    const petAlreadyExists = (petId !== '');
    const method = (petAlreadyExists) ? 'PUT' : 'POST';
    const path = (petAlreadyExists) ? `Pet/${petId}` : 'Pet';
    const data = {
      ownerId,
      petName,
      breedId,
      speciesId: parseInt(speciesId, 10),
      pureBreed,
      microchipId,
      conditions: [], // hardcoded
    };
    return new Promise((resolve, reject) => {
      APIClient.callAPI(`${this.basePath}/${path}`, `${method}`, null, data, resolve, reject, 'json');
    });
  }

  /** Returns the available products for a pet.
   *    Note that the "recId" values are used as the product IDs, and are always changing.
   * @param petId - string
   * @returns {Promise<unknown>}
   */
  getAvailableProducts(petId) {
    const path = `Product/NonInsurance/GetAvailable/${petId}`;
    return new Promise((resolve, reject) => {
      APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, null, null, resolve, reject, 'json');
    });
  }

  /** Save the selected product for a pet.
   *    If the {petId, productId} combination already exists, it will be updated.
   *    To "delete" the product from the pet, set the quantity to 0.
   * @param petId - string
   * @param productId - int
   * @param quantity - int
   * @param isAutoRenew - boolean
   * @returns {Promise<unknown>}
   */
  saveSelectedProduct(petId, productId, quantity = 1, isAutoRenew = false) {
    // warning: although this is a POST request, the data is sent as query parameters

    const quoteRecId = asInt(productId);
    const qty = asInt(quantity);
    const autoRenew = asBoolean(isAutoRenew);

    const path = 'Product/NonInsurance/SaveSelected';
    const params = {
      petId,
      quoteRecId,
      quantity: qty,
      autoRenew,
    };
    return new Promise((resolve, reject) => {
      APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_POST, params, null, resolve, reject, 'json');
    });
  }

  getSelectedProductsForPet(petId) {
    const path = `Product/NonInsurance/GetSelectedForPet/${petId}`;
    return new Promise((resolve, reject) => {
      APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, null, null, resolve, reject, 'json');
    });
  }
}
