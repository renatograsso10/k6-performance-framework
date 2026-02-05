/**
 * Spike Test - Sudden traffic burst
 */

import { group, sleep, check } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { getEnvironment } from '../src/config/environments.js';
import { peopleApi } from '../src/api/peopleApi.js';
import { planetsApi } from '../src/api/planetsApi.js';
import { logger } from '../src/core/logger.js';
import { generateHtmlReport, generateJsonSummary } from '../src/core/reporter.js';
import { recordApiMetrics } from '../src/core/metrics.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '10s', target: 300 },
        { duration: '1m', target: 300 },
        { duration: '10s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 }
    ],
    thresholds: getThresholds('spike'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting SPIKE Test', { testType: 'spike', environment: environment.baseUrl });
    return { startTime: Date.now() };
}

export default function () {
    group('Spike Traffic', () => {
        const id = Math.floor(Math.random() * 10) + 1;
        const resp = Math.random() < 0.5 ? peopleApi.get(id) : planetsApi.get(id);

        check(resp, { 'status ok': (r) => r.status === 200 });
        recordApiMetrics('spike.request', resp.timings.duration, resp.status === 200, resp.status);
    });

    sleep(0.1);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('SPIKE Test Complete', { duration: `${(duration / 60).toFixed(1)} min` });
}

export function handleSummary(data) {
    return {
        'reports/spike-report.html': generateHtmlReport(data, 'spike'),
        'reports/spike-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
