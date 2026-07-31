/**
 * Stable JSON serialization of the normalized report model.
 */
export function createJsonReport(model) {
    return {
        timestamp: model.timestamp,
        summary: { ...model.summary },
        responseTime: {
            avg: model.responseTime.avg,
            min: model.responseTime.min,
            max: model.responseTime.max,
            p90: model.responseTime.p90,
            p95: model.responseTime.p95,
            p99: model.responseTime.p99
        },
        result: model.result
    };
}
