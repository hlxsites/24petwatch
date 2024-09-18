// Determine the environment
export const calcEnvironment = () => {
  const { href } = window.location;

  const detectEnvironment = () => {
    const environmentMap = {
      '24petwatch\\.com': 'prod',
      'aem-dev\\.24petwatch\\.com': 'dev',
      'aem-stage\\.24petwatch\\.com': 'stage',
      '.*\\.hlx\\.page': 'dev',
      localhost: 'dev',
    };

    let environment = 'prod';

    Object.keys(environmentMap).some((pattern) => {
      const regex = new RegExp(`^https?://(www\\.)?${pattern}`);
      if (regex.test(href)) {
        environment = environmentMap[pattern];
        return true;
      }
      return false;
    });

    return environment;
  };

  const currentEnvironment = detectEnvironment(href);

  const param = new URL(window.location).searchParams.get('config');
  if (param && currentEnvironment !== 'prod') {
    return param;
  }

  const environmentFromConfig = window.sessionStorage.getItem('environment');
  if (environmentFromConfig && currentEnvironment !== 'prod') {
    return environmentFromConfig;
  }

  return currentEnvironment;
};

/**
 * Build the URL to get the configurations of the environment
 * @param {string} environment - leave empty to auto calculate the environment
 * @returns config.json?sheet=<environment>
 */
function buildConfigURL(environment) {
  const env = !environment ? calcEnvironment() : environment;
  const configURL = new URL(`${window.location.origin}/configs.json`);
  configURL.searchParams.set('sheet', env);
  return configURL;
}

/**
 * @param {string} environment - leave empty to auto calculate the environment
 * @returns - configuration (key,value) pairs of the environment as configured in configs.json
 */
export const getConfigForEnvironment = async (environment) => {
  const env = (!environment) ? calcEnvironment() : environment;
  let configJSON = window.sessionStorage.getItem(`config:${env}`);
  if (!configJSON) {
    const configURL = buildConfigURL(env);
    const response = await fetch(configURL);
    const result = await response.json();
    configJSON = JSON.stringify(result);
    window.sessionStorage.setItem(`config:${env}`, configJSON);
  }
  return configJSON;
};

/**
 * @param {string} configParam - request value of a specific parameter
 * @param {string} environment - (optional) environment
 * @returns config value of the key
 */
export const getConfigValue = async (configParam, environment) => {
  const env = (!environment) ? calcEnvironment() : environment;
  const configJSON = await getConfigForEnvironment(env);
  const configElements = JSON.parse(configJSON).data;
  return configElements.find((c) => c.key === configParam)?.value;
};
