import load from '../load.test.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0']
    }
};

export default function () {
    const originalRandom = Math.random;
    Math.random = () => 0.6;
    try {
        load();
    } finally {
        Math.random = originalRandom;
    }
}
