/**
 * Custom metrics for detailed performance analysis
 */

import { Trend, Counter, Rate } from 'k6/metrics';

// Response time trends
export const apiResponseTime = new Trend('api_response_time', true);

// Error counters
export const apiErrors = new Counter('api_errors');
export const clientErrors = new Counter('client_errors_4xx');
export const serverErrors = new Counter('server_errors_5xx');
export const checkpointCount = new Counter('checkpoint_count');

// Rates
export const successRate = new Rate('success_rate');

export function recordApiMetrics(endpoint, duration, success, status, tags = {}) {
    const metricTags = { endpoint, ...tags };
    apiResponseTime.add(duration, metricTags);
    successRate.add(success, metricTags);

    if (!success) {
        apiErrors.add(1, { ...metricTags, status });
        if (status >= 500) serverErrors.add(1, metricTags);
        else if (status >= 400) clientErrors.add(1, metricTags);
    }
}
