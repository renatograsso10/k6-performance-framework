/**
 * Environment configuration
 */

const environments = {
    production: {
        baseUrl: 'https://swapi.dev',
        timeout: '30s',
        maxRetries: 2
    },
    staging: {
        baseUrl: 'https://swapi.dev',
        timeout: '30s',
        maxRetries: 2
    },
    development: {
        baseUrl: 'https://swapi.dev',
        timeout: '60s',
        maxRetries: 3
    }
};

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

export function getEnvironment() {
    const envName = (typeof __ENV !== 'undefined' && __ENV.ENVIRONMENT) ? __ENV.ENVIRONMENT : 'production';
    return environments[envName] || environments.production;
}

export function getBaseUrl() {
    return getEnvironment().baseUrl;
}

export function getDefaultHeaders() {
    return { ...defaultHeaders };
}

export function getTimeout() {
    return getEnvironment().timeout;
}

export default { getEnvironment, getBaseUrl, getDefaultHeaders, getTimeout, environments };
