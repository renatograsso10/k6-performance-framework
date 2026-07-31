import { HttpClient } from '../../src/core/httpClient.js';

export const options = {
    vus: 1,
    iterations: 1,
    summaryTrendStats: ['count']
};

export default function () {
    const client = new HttpClient({ baseUrl: 'https://fixture.invalid' });
    client.processResponse({
        status: 200,
        body: '{}',
        headers: {},
        timings: { duration: 25 },
        json: () => ({})
    }, 'GET', 'https://fixture.invalid/api/people/1', 'people.get');
}

export function handleSummary(data) {
    const samples = data.metrics.api_response_time?.values?.count || 0;
    if (samples !== 1) {
        throw new Error(`expected one api_response_time sample, received ${samples}`);
    }

    return {};
}
