function buildOwnerPayload(email, zipCode, cartFlow) {
  return {
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
}

export default class APIClient {
  static METHOD_GET = 'GET';

  static METHOD_PUT = 'PUT';

  static METHOD_POST = 'POST';

  static METHOD_DELETE = 'DELETE';

  constructor(basePath) {
    this.basePath = basePath || 'https://348665-24petwatch-stage.adobeioruntime.net/api/v1/web/24petwatch-appbuilder/proxy-pethealth-services';
  }

  static callAPI(url, method, data, done, fail, type) {
    const options = { method };
    let urlWithParams = url; // might remain as the original URL if no data is provided
    if (data) {
      if (method !== 'GET') {
        options.headers = {
          'Content-Type': 'application/json',
        };
        const payload = { payload: data };
        options.body = JSON.stringify(payload);
      } else {
        // urlWithParams += '?' + new URLSearchParams(data).toString();
        const urlSearchParams = new URLSearchParams(data).toString();
        urlWithParams += `?${urlSearchParams}`;
      }
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
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, { speciesId, purebreed }, done, fail, 'json');
  }

  validateNonInsurancePromoCodeWithSpecies(promoCode, countryId, speciesId, done, fail) {
    const path = 'Product/ValidateNonInsurancePromoCodeWithSpecies';
    const data = {
      promoCode,
      country: countryId,
    };
    if (speciesId) {
      data.species = speciesId;
    }
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_GET, data, done, fail, 'json');
  }

  getCountryStates(zipCode, done, fail) {
    const path = 'Utility/GetCountryState';
    APIClient.callAPI(`${this.basePath}/${path}/${zipCode}`, APIClient.METHOD_GET, null, done, fail, 'json');
  }

  postOwner(email, zipCode, cartFlow, done, fail) {
    const path = 'Owner';
    const data = buildOwnerPayload(email, zipCode, cartFlow);
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_POST, data, done, fail, 'json');
  }

  putOwner(ownerId, email, zipCode, cartFlow, done, fail) {
    const path = `Owner/${ownerId}`;
    const data = buildOwnerPayload(email, zipCode, cartFlow);
    APIClient.callAPI(`${this.basePath}/${path}`, APIClient.METHOD_PUT, data, done, fail, 'json');
  }
}
