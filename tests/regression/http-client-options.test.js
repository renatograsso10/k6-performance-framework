import { check } from 'k6';
import { HttpClient } from '../../src/core/httpClient.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1'],
        'http_reqs{type:health}': ['count==1']
    }
};

export default function () {
    const response = new HttpClient().get('/health', { endpointType: 'health' });
    check(response, { 'GET options are applied from second argument': (result) => result.status === 200 });
}
