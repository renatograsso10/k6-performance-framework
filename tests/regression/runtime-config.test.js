import { check } from 'k6';
import { resolveEnvironment } from '../../src/config/environments.js';
import { HttpClient } from '../../src/core/httpClient.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

function rejects(config) {
    try {
        resolveEnvironment(config);
        return false;
    } catch (_) {
        return true;
    }
}

export default function () {
    const defaults = resolveEnvironment({});
    const configured = resolveEnvironment({
        ENVIRONMENT: 'development',
        BASE_URL: 'https://example.test/',
        REQUEST_TIMEOUT: '5s',
        MAX_RETRIES: '2'
    });
    const client = new HttpClient();

    check({ defaults, configured, client }, {
        'defaults are explicit and retry-free': (result) => result.defaults.name === 'production'
            && result.defaults.baseUrl === 'https://swapi.info'
            && result.defaults.timeout === '30s'
            && result.defaults.maxRetries === 0,
        'runtime overrides are applied': (result) => result.configured.name === 'development'
            && result.configured.baseUrl === 'https://example.test'
            && result.configured.timeout === '5s'
            && result.configured.maxRetries === 2,
        'HttpClient consumes runtime timeout and retries': (result) => result.client.timeout === '7s'
            && result.client.retries === 2
            && result.client.baseUrl.startsWith('http://127.0.0.1:'),
        'invalid runtime config fails fast': () => rejects({ ENVIRONMENT: 'qa' })
            && rejects({ BASE_URL: 'ftp://example.test' })
            && rejects({ BASE_URL: 'https://user:secret@example.test' })
            && rejects({ BASE_URL: 'https://example.test?token=secret' })
            && rejects({ BASE_URL: 'https://example.test#private' })
            && rejects({ REQUEST_TIMEOUT: 'soon' })
            && rejects({ MAX_RETRIES: '-1' })
    });
}
