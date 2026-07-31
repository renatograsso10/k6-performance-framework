import smoke from '../smoke.test.js';

export const options = {
    vus: 1,
    iterations: 1,
    summaryTrendStats: ['count']
};

export default smoke;

export function handleSummary(data) {
    const requests = data.metrics.http_reqs?.values?.count || 0;
    const responseSamples = data.metrics.api_response_time?.values?.count || 0;
    const successSamples = (data.metrics.success_rate?.values?.passes || 0)
        + (data.metrics.success_rate?.values?.fails || 0);

    if (responseSamples !== requests) {
        throw new Error(`expected ${requests} response-time samples, received ${responseSamples}`);
    }
    if (successSamples !== requests) {
        throw new Error(`expected ${requests} success samples, received ${successSamples}`);
    }

    return {};
}
