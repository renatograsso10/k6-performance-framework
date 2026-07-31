import { check } from 'k6';
import { assertTargetAllowed } from '../../src/config/targetPolicy.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

function isRejected(profile, baseUrl, maxRetries = 0) {
    try {
        assertTargetAllowed(profile, baseUrl, maxRetries);
        return false;
    } catch (_) {
        return true;
    }
}

export default function () {
    check({}, {
        'public SWAPI allows only external smoke': () => assertTargetAllowed('external-smoke', 'https://swapi.info')
            && isRejected('smoke', 'https://swapi.info')
            && isRejected('load', 'https://swapi.info/')
            && isRejected('load', 'https://user:pass@swapi.info/')
            && isRejected('load', 'https://SWAPI.INFO.:443'),
        'public external smoke is always retry-free': () => assertTargetAllowed('external-smoke', 'https://swapi.info', 0)
            && isRejected('external-smoke', 'https://swapi.info', 1),
        'controlled target allows performance profiles': () => assertTargetAllowed('load', 'http://127.0.0.1:3000')
            && assertTargetAllowed('stress', 'https://performance.example.internal')
    });
}
