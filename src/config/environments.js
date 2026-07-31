/**
 * Environment configuration
 */

const DEFAULT_BASE_URL = 'https://swapi.info';
const ENVIRONMENT_NAMES = new Set(['production', 'staging', 'development']);

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-performance-framework/1.0 (+https://github.com/renatograsso10/k6-performance-framework)'
};

export function resolveEnvironment(env = {}) {
    const name = env.ENVIRONMENT || 'production';
    if (!ENVIRONMENT_NAMES.has(name)) {
        throw new Error(`Unsupported ENVIRONMENT: ${name}`);
    }

    const baseUrl = (env.BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const urlParts = /^https?:\/\/([^\s/?#]+)(?:\/[^\s?#]*)?$/i.exec(baseUrl);
    if (!urlParts || urlParts[1].includes('@') || /[^\x00-\x7f]/.test(urlParts[1])) {
        throw new Error(`Invalid BASE_URL: ${baseUrl}`);
    }

    const timeout = env.REQUEST_TIMEOUT || '30s';
    if (!/^\d+(?:\.\d+)?(?:ms|s|m)$/i.test(timeout)) {
        throw new Error(`Invalid REQUEST_TIMEOUT: ${timeout}`);
    }

    const retriesValue = env.MAX_RETRIES ?? '0';
    const maxRetries = Number(retriesValue);
    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
        throw new Error(`Invalid MAX_RETRIES: ${retriesValue}`);
    }

    return { name, baseUrl, timeout, maxRetries };
}

export function getEnvironment() {
    return resolveEnvironment(typeof __ENV !== 'undefined' ? __ENV : {});
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

export function getMaxRetries() {
    return getEnvironment().maxRetries;
}
