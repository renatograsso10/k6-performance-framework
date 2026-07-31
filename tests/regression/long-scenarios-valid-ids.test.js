import soak from '../soak.test.js';
import endurance from '../endurance.test.js';

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
    try {
        Math.random = () => 0.7;
        soak();

        Math.random = () => 0.6;
        endurance({ startTime: Date.now() });
    } finally {
        Math.random = originalRandom;
    }
}
