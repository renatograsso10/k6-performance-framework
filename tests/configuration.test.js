import { check } from 'k6';
import { getEnvironment, resolveEnvironment } from '../src/config/environments.js';

const defaultBaseUrl = 'https://swapi.info';
const unicodeHostSeparators = ['\u3002', '\uff0e', '\uff61'];

function rejectsUnicodeHostname(separator) {
    try {
        resolveEnvironment({ BASE_URL: `https://swapi${separator}info` });
        return false;
    } catch (_) {
        return true;
    }
}

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1']
    }
};

export default function () {
    const expectedBaseUrl = __ENV.EXPECTED_BASE_URL || defaultBaseUrl;
    const environment = getEnvironment();

    check(environment, {
        'base URL matches configuration': (config) => config.baseUrl === expectedBaseUrl,
        'environment settings are preserved': (config) => config.timeout === '30s' && config.maxRetries === 0,
        'non-ASCII hostname separators are rejected before transport normalization': () => unicodeHostSeparators.every(rejectsUnicodeHostname)
    });
}
