import { baseMetricThresholdStatus, evaluateThresholdResults } from './thresholdEvaluation.js';

export function createReportModel(data, context = {}) {
    const metrics = data.metrics || {};
    const value = (metric, key, fallback = 0) => metrics[metric]?.values?.[key] ?? fallback;
    const result = evaluateThresholdResults(data);

    return {
        timestamp: new Date().toISOString(),
        context: {
            testType: context.testType || 'performance',
            targetUrl: context.targetUrl || 'unknown',
            targetKind: context.targetKind || 'unspecified',
            runId: context.runId || 'local'
        },
        summary: {
            totalRequests: value('http_reqs', 'count'),
            requestRate: value('http_reqs', 'rate'),
            errorRate: value('http_req_failed', 'rate') * 100,
            checksPassed: value('checks', 'rate') * 100
        },
        responseTime: {
            avg: value('http_req_duration', 'avg'),
            min: value('http_req_duration', 'min'),
            med: value('http_req_duration', 'med'),
            max: value('http_req_duration', 'max'),
            p90: value('http_req_duration', 'p(90)'),
            p95: value('http_req_duration', 'p(95)'),
            p99: value('http_req_duration', 'p(99)')
        },
        operations: {
            iterations: value('iterations', 'count'),
            dataReceivedBytes: value('data_received', 'count'),
            dataSentBytes: value('data_sent', 'count')
        },
        thresholdStatus: {
            duration: baseMetricThresholdStatus(result, 'http_req_duration'),
            errors: baseMetricThresholdStatus(result, 'http_req_failed'),
            checks: baseMetricThresholdStatus(result, 'checks')
        },
        result
    };
}
