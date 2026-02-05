/**
 * Reusable check functions for API responses
 */

import { check } from 'k6';
import { logger } from '../core/logger.js';
import { reportCollector } from '../core/reporter.js';

export function checkStatus(response, expectedStatus, name = 'status check') {
    const result = check(response, {
        [`${name}: status is ${expectedStatus}`]: (r) => r.status === expectedStatus
    });
    logger.check(`${name}: status is ${expectedStatus}`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkSuccess(response, name = 'success check') {
    const result = check(response, {
        [`${name}: is successful`]: (r) => r.status >= 200 && r.status < 300
    });
    logger.check(`${name}: is successful`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkHasData(response, field = 'data', name = 'data check') {
    const json = response.json ? response.json() : null;
    const result = check(json, {
        [`${name}: has ${field}`]: (j) => j && j[field] !== undefined
    });
    logger.check(`${name}: has ${field}`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkDuration(response, maxDuration = 500, name = 'duration check') {
    const duration = response.timings ? response.timings.duration : 0;
    const result = check(response, {
        [`${name}: duration < ${maxDuration}ms`]: () => duration < maxDuration
    });
    logger.check(`${name}: duration < ${maxDuration}ms (actual: ${duration}ms)`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkArrayNotEmpty(response, arrayField = 'data', minCount = 1, name = 'array check') {
    const json = response.json ? response.json() : null;
    const result = check(json, {
        [`${name}: ${arrayField} has at least ${minCount} items`]: (j) =>
            j && Array.isArray(j[arrayField]) && j[arrayField].length >= minCount
    });
    logger.check(`${name}: ${arrayField} has items`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkFieldValue(response, field, expectedValue, name = 'field check') {
    const json = response.json ? response.json() : null;
    const getValue = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj);
    const actualValue = getValue(json, field);
    const result = check(json, {
        [`${name}: ${field} equals ${expectedValue}`]: () => actualValue === expectedValue
    });
    logger.check(`${name}: ${field} equals ${expectedValue}`, result);
    reportCollector.addCheck(result);
    return result;
}

export function checkApiResponse(response, expectedStatus = 200, dataField = 'data', name = 'api') {
    const statusOk = checkStatus(response, expectedStatus, name);
    const hasData = expectedStatus < 300 ? checkHasData(response, dataField, name) : true;
    const durationOk = checkDuration(response, 1000, name);
    return statusOk && hasData && durationOk;
}

export default {
    checkStatus, checkSuccess, checkHasData, checkDuration,
    checkArrayNotEmpty, checkFieldValue, checkApiResponse
};
