// Note: Once the actual APIClient is implemented, this file should be removed.
//       Replace any references to this file with the actual APIClient.
export default class APIClient {
  static METHOD_GET = 'GET';

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
        options.body = JSON.stringify(data);
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
}
