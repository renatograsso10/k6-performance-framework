import { thresholdStatus } from './thresholdEvaluation.js';

export function createCheckpointSchedule(intervalMinutes = 15) {
    if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
        throw new Error(`Invalid checkpoint interval: ${intervalMinutes}`);
    }

    let lastCheckpoint = 0;
    return {
        take(elapsedMinutes) {
            if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) return null;
            const due = Math.floor(elapsedMinutes / intervalMinutes) * intervalMinutes;
            if (due === 0 || due <= lastCheckpoint) return null;
            lastCheckpoint = due;
            return due;
        }
    };
}

export function analyzeBreakpoint(data, levels) {
    let maxHealthyVus = null;
    let firstFailedVus = null;
    let healthySequence = true;

    const stages = levels.map((vus) => {
        const scenario = `vus_${String(vus).padStart(4, '0')}`;
        const metrics = ['http_req_duration', 'http_req_failed', 'checks'].map((metric) => ({
            metric,
            status: thresholdStatus(data.metrics?.[`${metric}{scenario:${scenario}}`])
        }));
        const statuses = metrics.map((metric) => metric.status);
        const status = statuses.includes('no_data')
            ? 'no_data'
            : statuses.includes('failed')
                ? 'failed'
                : statuses.every((value) => value === 'passed') ? 'passed' : 'unknown';

        if (status === 'passed' && healthySequence) maxHealthyVus = vus;
        if (status !== 'passed') healthySequence = false;
        if (status === 'failed' && firstFailedVus === null) firstFailedVus = vus;

        return { vus, scenario, status, metrics };
    });

    return { maxHealthyVus, firstFailedVus, stages };
}
