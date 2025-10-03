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
            'COSTCO_TOKEN',
            'COSTCO_REST_URI',
            'payload',
        ]
        const requiredHeaders = []
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
        
        if (errorMessage) {
        // return and log client errors
            return errorResponse(400, errorMessage, logger)
        }

        const data = params.payload || {};
        return await getPolicyData('get', params.COSTCO_REST_URI, params.COSTCO_TOKEN, data, logger);

    } catch (error) {
        // log any server errors
        logger.error(error)
        // return with 500
        return errorResponse(500, 'Catched internal server error', logger)
    }
}

async function getPolicyData(method, endpoint, token, payload, logger) {
    const params = {
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
        }
    }
    const policyId = payload.policyId ?? '';
    const soqlQuery = `SELECT Id, Number__c, Type__c, Level__c, Status__c, Insurance_Policy__r.Status FROM Membership__c WHERE Insurance_Policy__c = '${policyId}'`;
    const finalUrl = endpoint + "/services/data/v61.0/query/?q=";
    
    const res = await fetch(finalUrl + encodeURIComponent(soqlQuery), params);
    const body = await res.text();

    try {
        const jsonBody = JSON.parse(body);
        
        // Check eligibility based on the specified criteria
        let eligible = false;
        
        if (jsonBody.records && jsonBody.records.length > 0) {
            const record = jsonBody.records[0]; // Assuming we check the first record
            
            // Check eligibility criteria:
            // level: ['Executive']
            // status: 'Active' 
            // policyStatus: ['Future', 'Active']
            const isExecutiveLevel = record.Level__c === 'Executive';
            const isActiveStatus = record.Status__c === 'Active';
            const isValidPolicyStatus = ['Future', 'Active'].includes(record.Insurance_Policy__r?.Status);
            
            eligible = isExecutiveLevel && isActiveStatus && isValidPolicyStatus;
            
            logger.info(`Eligibility check: Level=${record.Level__c}, Status=${record.Status__c}, PolicyStatus=${record.Insurance_Policy__r?.Status}, Eligible=${eligible}`);
        } else {
            logger.info('No membership records found for policy ID');
        }
        
        return {
            statusCode: res.status,
            body: {
                isEligible: eligible
            },
        }
    } catch (error) {
        logger.error('Error parsing response:', error);
        return errorResponse(500, 'Catched internal server error', logger)
    }
}

exports.main = main
