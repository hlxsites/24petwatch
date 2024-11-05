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
    logger.debug(stringParameters(params))

    if (params.__ow_method !== 'post') {
        return errorResponse(405, 'Only POST allowed', logger)
    }

    // check for missing request input parameters and headers
    const requiredParams = [
        'SALESFORCE_TOKEN',
        'SALESFORCE_REST_EVENTS_URI',
        'SALESFORCE_REST_EVENTS_UPSERT_URI',
        'payload',
    ]
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const data = params.payload || {};

    const response = await createRequest('post', params.SALESFORCE_REST_EVENTS_URI, params.SALESFORCE_TOKEN, [], data)
    if (response.status !== 201) {

        return await updateRequest('put', params.SALESFORCE_REST_EVENTS_UPSERT_URI, params.SALESFORCE_TOKEN, [], data, logger)
    } else {
        return {statusCode: 200, body: {values: data.Data}};
    }
} catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'Catched internal server error', logger)
  }
}

async function createRequest(method, url, token, queryParams, payload = false) {
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

    return await fetch(finalUrl , params);
}

async function updateRequest(method, url, token, queryParams, payload = false, logger) {
    const params = {
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
        }
    }

    if (payload) {
        params.body = JSON.stringify({values: payload.Data})

        url = url + 'EmailAddress:' + payload.ContactKey;
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
            statusCode: 200,
            body: {
                "action": "updated",
                "values": payload.Data,
            },
        }
    } catch (error) {
        return errorResponse(500, 'Catched internal server error', logger)
    }
}

exports.main = main
