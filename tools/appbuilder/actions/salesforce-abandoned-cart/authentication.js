/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */

const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
let logger;

const cache = {
  date: 0,
  token: '',
};

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  logger = Core.Logger('main', { level: 'debug' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.error(stringParameters(params))
    logger.error(stringParameters(cache))

    // check for missing request input parameters and headers
    const requiredParams = [ 'SALESFORCE_CLIENT_ID' , 'SALESFORCE_CLIENT_SECRET', 'SALESFORCE_AUTH_URI', 'SALESFORCE_ACCOUNT_ID']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const authUrl = new URL('/v2/token', params.SALESFORCE_AUTH_URI);
    const token = await getToken(
      params.SALESFORCE_CLIENT_ID,
      params.SALESFORCE_CLIENT_SECRET,
      params.SALESFORCE_ACCOUNT_ID,
      params.SALESFORCE_SCOPES || false,
      authUrl.toString()
    );

    if (!token) {
      return errorResponse(401, 'Authenticaction failed', logger)
    }

    return {SALESFORCE_TOKEN: token, ...params}
    //return errorResponse(500, 'server error', logger)
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

async function getToken(user, key, accountId, scope, authUrl) {
    const now = Date.now();
    if (cache.date === undefined || now - cache.date > 60 * 60 * 3) {
        cache.date = now;
        cache.token = await fetchToken(user, key, accountId, scope, authUrl);
    }

    return cache.token;
} 

async function fetchToken(client_id, client_secret, account_id, scope, authUrl) {
    const data ={
      "grant_type": "client_credentials",
      "client_id": client_id,
      "client_secret": client_secret,
      "account_id": account_id
    }

    if (scope) {
      data.scope = scope;
    }

    logger.debug('data', data)
    const res = await fetch(authUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })

    if (res.status !== 200 && res.status !== 401 && res.status !== 403 && res.status !== 404) {
        throw Error(`unexpected error with status '${res.status}' from '${authUrl.toString()}', please report this error`)
    }

    const response = await (res.json())
    logger.debug('response', response)

    return response.access_token;
}

exports.main = main
