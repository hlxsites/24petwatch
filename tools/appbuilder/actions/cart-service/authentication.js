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


const cache = {
  date: 0,
  token: '',
};

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: 'debug' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.error(stringParameters(params))
    logger.error(stringParameters(cache))

    // check for missing request input parameters and headers
    const requiredParams = [ 'PETHEALTH_USERNAME' , 'PETHEALTH_API_KEY', 'PETHEALTH_BASE_DOMAIN']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const AUTHENTICATION_URL = `${params['PETHEALTH_BASE_DOMAIN']}/Auth/Login`;
    logger.info('Will query ' + AUTHENTICATION_URL)
    const token = await getToken(params.PETHEALTH_USERNAME, params.PETHEALTH_API_KEY, AUTHENTICATION_URL)

    return {PETHEALTH_TOKEN: token, ...params }
    //return errorResponse(500, 'server error', logger)
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

async function getToken(user, key, authUrl) {
    const now = Date.now();
    if (cache.date === undefined || now - cache.date > 60 * 60 * 3) {
        cache.date = now;
        cache.token = await fetchToken(user, key, authUrl);
    }

    return cache.token;
} 

async function fetchToken(user, key, authUrl) {
    const data = {
        username: user,
        apI_KEY: key
    }
    const res = await fetch(authUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })

    if (res.status !== 200 && res.status !== 401 && res.status !== 403 && res.status !== 404) {
        throw Error(`unexpected error with status '${res.status}' from '${authUrl.toString()}', please report this error`)
    }

    const response = await (res.json())

    return response.token;
}

exports.main = main
