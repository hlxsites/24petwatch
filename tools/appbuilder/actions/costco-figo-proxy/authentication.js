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
    const requiredParams = [ 'COSTCO_CLIENT_ID' , 'COSTCO_CLIENT_SECRET', 'COSTCO_AUTH_URI', 'COSTCO_USERNAME', 'COSTCO_PASSWORD']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const authUrl = new URL('/services/oauth2/token', params.COSTCO_AUTH_URI);
    const token = await getToken(
      params.COSTCO_CLIENT_ID,
      params.COSTCO_CLIENT_SECRET,
      params.COSTCO_USERNAME,
      params.COSTCO_PASSWORD,
      authUrl.toString()
    );

    if (!token) {
      return errorResponse(401, 'Authenticaction failed', logger)
    }

    return {COSTCO_TOKEN: token, ...params}

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

async function getToken(client_id, client_secret, username, password, authUrl) {
    const now = Date.now();
    if (cache.date === undefined || now - cache.date > 60 * 60 * 3) {
        cache.date = now;
        cache.token = await fetchToken(client_id, client_secret, username, password, authUrl);
    }

    return cache.token;
} 

async function fetchToken(client_id, client_secret, username, password, authUrl) {
  logger.info('authUrl', authUrl)
  logger.info('client_id', client_id)
    const data = new URLSearchParams();
    data.append('grant_type', 'password');
    data.append('client_id', client_id);
    data.append('client_secret', client_secret);
    data.append('username', username);
    data.append('password', password);

    const res = await fetch(authUrl, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (res.status !== 200 && res.status !== 401 && res.status !== 403 && res.status !== 404) {
        throw Error(`unexpected error with status '${res.status}' from '${authUrl.toString()}', please report this error`)
    }

    const response = await (res.json())
    logger.info('response', response)

    return response.access_token;
}

exports.main = main
