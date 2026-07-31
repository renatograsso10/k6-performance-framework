export function thresholdStatus(metric) {
    if (!metric) return 'no_data';
    const thresholds = Object.values(metric.thresholds || {});
    if (thresholds.length === 0) return 'unknown';
    return thresholds.every((threshold) => threshold.ok === true) ? 'passed' : 'failed';
}

export function evaluateThresholdResults(data) {
    const details = [];

    for (const [metric, metricData] of Object.entries(data.metrics || {})) {
        for (const [expression, outcome] of Object.entries(metricData.thresholds || {})) {
            details.push({ metric, expression, passed: outcome.ok === true });
        }
    }

    const passed = details.filter((threshold) => threshold.passed).length;
    const failed = details.length - passed;
    const requests = data.metrics?.http_reqs?.values?.count || 0;
    const status = requests === 0
        ? 'no_data'
        : details.length === 0
            ? 'unknown'
            : failed > 0 ? 'failed' : 'passed';

    return {
        status,
        passed: status === 'passed',
        thresholds: { total: details.length, passed, failed, details }
    };
}

export function baseMetricThresholdStatus(result, metric) {
    const thresholds = result.thresholds.details.filter((item) => item.metric === metric
        || item.metric.startsWith(`${metric}{`));
    if (thresholds.length === 0) return 'unknown';
    return thresholds.some((item) => !item.passed) ? 'failed' : 'passed';
}
