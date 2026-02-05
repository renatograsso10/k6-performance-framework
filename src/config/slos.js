/**
 * SLO definitions and Error Budget tracking
 */

export const SLODefinitions = {
    auth: {
        name: 'Authentication',
        availability: 0.999,
        latencyP95: 500,
        latencyP99: 1000,
        errorRate: 0.001
    },
    read_apis: {
        name: 'Read APIs',
        availability: 0.995,
        latencyP95: 800,
        latencyP99: 2000,
        errorRate: 0.01
    },
    write_apis: {
        name: 'Write APIs',
        availability: 0.999,
        latencyP95: 1000,
        latencyP99: 3000,
        errorRate: 0.005
    },
    critical: {
        name: 'Critical APIs',
        availability: 0.9999,
        latencyP95: 300,
        latencyP99: 500,
        errorRate: 0.0001
    }
};

export function calculateErrorBudget(totalRequests, failedRequests, targetSLO = 0.999) {
    const allowedErrorRate = 1 - targetSLO;
    const errorBudgetTotal = totalRequests * allowedErrorRate;
    const errorBudgetUsed = failedRequests;
    const percentUsed = (errorBudgetUsed / errorBudgetTotal) * 100;

    return {
        totalRequests,
        failedRequests,
        errorBudgetTotal: Math.floor(errorBudgetTotal),
        errorBudgetUsed,
        errorBudgetRemaining: Math.max(0, Math.floor(errorBudgetTotal - errorBudgetUsed)),
        percentUsed: Math.min(100, percentUsed),
        isHealthy: percentUsed < 80,
        isWarning: percentUsed >= 80 && percentUsed < 100,
        isCritical: percentUsed >= 100,
        summary: getSummary(percentUsed)
    };
}

function getSummary(percentUsed) {
    if (percentUsed < 50) return 'Healthy - safe to deploy';
    if (percentUsed < 80) return 'Warning - be careful with risky changes';
    if (percentUsed < 100) return 'Critical - avoid deployments';
    return 'Budget exceeded - investigate immediately';
}

export function evaluateSLO(testData, sloType = 'read_apis') {
    const slo = SLODefinitions[sloType];
    const metrics = testData.metrics || {};

    const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
    const p99 = metrics.http_req_duration?.values?.['p(99)'] || 0;
    const errorRate = metrics.http_req_failed?.values?.rate || 0;
    const total = metrics.http_reqs?.values?.count || 0;
    const failed = Math.round(total * errorRate);

    const p95Pass = p95 <= slo.latencyP95;
    const p99Pass = p99 <= slo.latencyP99;
    const errorPass = errorRate <= slo.errorRate;

    return {
        sloName: slo.name,
        results: {
            latencyP95: { target: slo.latencyP95, actual: p95, passed: p95Pass },
            latencyP99: { target: slo.latencyP99, actual: p99, passed: p99Pass },
            errorRate: { target: slo.errorRate, actual: errorRate, passed: errorPass }
        },
        allPassed: p95Pass && p99Pass && errorPass,
        errorBudget: calculateErrorBudget(total, failed, slo.availability)
    };
}

export default { SLODefinitions, calculateErrorBudget, evaluateSLO };
