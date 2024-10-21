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
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')

const cache = {};

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.error(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = [ 'PETHEALTH_TOKEN', 'PETHEALTH_BASE_DOMAIN']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const queryParams = Object.keys(params)
        .filter(key => !key.startsWith('PETHEALTH') && !key.startsWith('__ow') && key !== "LOG_LEVEL" && key !== "payload")
        .reduce((obj, key) => {
            obj[key] = params[key];
            return obj;
        }, {});

    console.log('queryParams' + JSON.stringify(queryParams));

    let payload = false;
    if (params.payload !== undefined) {
        payload = params.payload;
    }

    console.log('payload' + JSON.stringify(payload));

    const url = `${params['PETHEALTH_BASE_DOMAIN']}${params.__ow_path}`

    return await performRequest(params.__ow_method, url, params.PETHEALTH_TOKEN, queryParams, payload)
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'Catched internal server error', logger)
  }
}

async function getToken(user, key) {
    const now = Date.now();
    if (cache.date === undefined || now - cache.date > 60 * 60 * 3) {
        cache.date = now;
        cache.token = fetchToken(user, key);
    }

    return cache.token;
} 

async function performRequest(method, url, token, queryParams, payload = false) {

    const params = {
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
        }
    }

    if (payload) {
        params.body = JSON.stringify(payload)
    }

    let finalUrl = url;
    if (Object.keys(queryParams).length > 0) {
        finalUrl = url + '?' + new URLSearchParams(queryParams)
    }

    const res = await fetch(finalUrl , params);
    const body = await res.text();

    try {
        const jsonBody = JSON.parse(body);
        return {
            statusCode: res.status,
            body: jsonBody,
        }
    } catch (error) {
        return {
            statusCode: res.status,
            body: body,
        }
    }
}

exports.main = main
