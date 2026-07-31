import { check } from 'k6';
import { HttpClient } from '../../src/core/httpClient.js';

export const options = {
    vus: 1,
    iterations: 1,
    summaryTrendStats: ['count'],
    thresholds: {
        checks: ['rate==1'],
        'http_reqs{type:retry-contract}': ['count==2'],
        'success_rate{endpoint:retry-contract}': ['rate==0.5']
    }
};

export default function () {
    const response = new HttpClient().get('/unstable?failures=1', { endpointType: 'retry-contract' });

    check(response, {
        'configured retry recovers one transient 500': (result) => result.status === 200
    });
}

export function handleSummary(data) {
    const successMetric = data.metrics['success_rate{endpoint:retry-contract}']?.values || {};
    const samples = (successMetric.passes || 0) + (successMetric.fails || 0);
    if (samples !== 2 || successMetric.passes !== 1 || successMetric.fails !== 1) {
        throw new Error(`expected one metric sample per HTTP attempt, received ${JSON.stringify(successMetric)}`);
    }
    return {};
}
