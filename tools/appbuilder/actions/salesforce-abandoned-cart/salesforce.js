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

let logger;

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.error(stringParameters(params))

    if (params.__ow_method !== 'post') {
        return errorResponse(405, 'Only POST allowed', logger)
    }

    // check for missing request input parameters and headers
    const requiredParams = [
        'SALESFORCE_TOKEN',
        'SALESFORCE_REST_URI',
        'SALESFORCE_EVENT_DEFINITION',
        'data'
    ]
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const data = {"Data": params.data};
    if (params.data['EmailAddress'] !== undefined) {
        data['ContactKey'] = params.data['EmailAddress'];
    }
    data['EventDefinitionKey'] = params.SALESFORCE_EVENT_DEFINITION;


    //const url = new URL('/interaction/v1/events', params.SALESFORCE_REST_URI);
    const url = new URL('https://webhook.site/72f3d3b9-a9d4-4ed2-aaf8-609fba3e4d1c')

    return await performRequest('post', url.toString(), params.SALESFORCE_TOKEN, [], data)
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'Catched internal server error', logger)
  }
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
