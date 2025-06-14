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

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  // 24PW PRD credentials
  const captchaSecret = '6LdpPxIqAAAAAOBI1_Bj5BJUv5luwoMBGM06WtsL';

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.error(stringParameters(params));

    // check for missing request input parameters and headers
    const requiredParams = ['email', 'text', 'topic', 'captchaToken'];
    const requiredHeaders = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    const { email, text, topic, captchaToken } = params;
    // Wrapping the body in another object with data key to match the expected format of the final endpoint
    const body = {
      data: {
        email,
        text,
        topic,
      }
    };

    // Validate Captcha
    const captchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: captchaSecret, response: captchaToken }),
    });
    const data = await captchaResponse.json();
    logger.debug('reCAPTCHA response:', data);

    if (!captchaResponse.ok || !data.success) {
      return errorResponse(400, 'Captcha Invalid', logger);
    }

    // Send body to final endpoint
    // TODO: Remove commented endpoint once the approach is approved
    // const finalEndpoint = 'https://www.24petwatch.com/content/24petwatch/us/en/contact-us/jcr:content/root/container/container/container/container_copy_56622/contactus_1508797198.contactus.json';
    const finalEndpoint = 'https://main--24petwatch--hlxsites.hlx.page/contact-us-form';
    const finalResponse = await fetch(finalEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!finalResponse.ok) {
      const responseStatus = finalResponse.status;
      const responseBody = await finalResponse.json();
      logger.debug(responseStatus, responseBody);

      return errorResponse(500, `Contact Us API error occured: ${responseStatus} ${JSON.stringify(responseBody)}`, logger);
    }

    return {
      statusCode: 200,
      body: {
        message: "Success",
      }
    };

  } catch (error) {
    // log any server errors
    logger.error(error);
    // return with 500
    return errorResponse(500, 'server error', logger);
  }
}

exports.main = main
