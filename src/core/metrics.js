/**
 * Custom metrics for detailed performance analysis
 */

import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

// Response time trends
export const apiResponseTime = new Trend('api_response_time', true);
export const authResponseTime = new Trend('auth_response_time', true);
export const usersResponseTime = new Trend('users_response_time', true);
export const resourcesResponseTime = new Trend('resources_response_time', true);

// Error counters
export const apiErrors = new Counter('api_errors');
export const clientErrors = new Counter('client_errors_4xx');
export const serverErrors = new Counter('server_errors_5xx');
export const timeoutErrors = new Counter('timeout_errors');
export const checkpointCount = new Counter('checkpoint_count');

// Rates
export const successRate = new Rate('success_rate');
export const businessTransactions = new Rate('business_transactions');
export const cacheHitRate = new Rate('cache_hit_rate');

// Gauges
export const activeUsers = new Gauge('active_users');
export const queueSize = new Gauge('queue_size');

// Helper functions
export function recordApiResponseTime(duration) {
    apiResponseTime.add(duration);
}

export function recordApiSuccess() {
    successRate.add(1);
}

export function recordApiError(type = 'client') {
    apiErrors.add(1);
    successRate.add(0);
    if (type === 'server') serverErrors.add(1);
    else clientErrors.add(1);
}

export function recordActiveVus() {
    const vu = (typeof __VU !== 'undefined') ? __VU : 0;
    activeUsers.set(vu);
}

export function recordApiMetrics(endpoint, duration, success, status) {
    apiResponseTime.add(duration, { endpoint });
    successRate.add(success);

    if (!success) {
        apiErrors.add(1, { endpoint, status });
        if (status >= 500) serverErrors.add(1);
        else if (status >= 400) clientErrors.add(1);
    }
}

export function recordEndpointMetrics(type, duration) {
    const metricMap = { auth: authResponseTime, users: usersResponseTime, resources: resourcesResponseTime };
    (metricMap[type] || apiResponseTime).add(duration);
}

export function recordTransaction(success) {
    businessTransactions.add(success);
}

export const customMetrics = {
    apiResponseTime, authResponseTime, usersResponseTime, resourcesResponseTime,
    apiErrors, clientErrors, serverErrors, timeoutErrors, checkpointCount,
    successRate, businessTransactions, cacheHitRate,
    activeUsers, queueSize
};

export default {
    ...customMetrics,
    recordApiMetrics, recordEndpointMetrics, recordTransaction,
    recordApiResponseTime, recordApiSuccess, recordApiError, recordActiveVus
};
