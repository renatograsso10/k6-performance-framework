/**
 * Soak Test - Extended duration stability
 */

import { group, sleep, check } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { getEnvironment } from '../src/config/environments.js';
import { peopleApi } from '../src/api/peopleApi.js';
import { planetsApi } from '../src/api/planetsApi.js';
import { starshipsApi } from '../src/api/starshipsApi.js';
import { logger } from '../src/core/logger.js';
import { generateHtmlReport, generateJsonSummary } from '../src/core/reporter.js';
import { recordApiMetrics } from '../src/core/metrics.js';

export const options = {
    stages: [
        { duration: '2m', target: 50 },
        { duration: '30m', target: 50 },
        { duration: '2m', target: 0 }
    ],
    thresholds: getThresholds('soak'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting SOAK Test', { testType: 'soak', environment: environment.baseUrl });
    return { startTime: Date.now() };
}

export default function () {
    const endpoints = [peopleApi, planetsApi, starshipsApi];
    const api = endpoints[Math.floor(Math.random() * endpoints.length)];
    const id = Math.floor(Math.random() * 10) + 1;

    group('Soak Operations', () => {
        const resp = api.get(id);
        check(resp, { 'status ok': (r) => r.status === 200 });
        recordApiMetrics('soak.request', resp.timings.duration, resp.status === 200, resp.status);
    });

    sleep(0.5);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('SOAK Test Complete', { duration: `${(duration / 60).toFixed(1)} min` });
}

export function handleSummary(data) {
    return {
        'reports/soak-report.html': generateHtmlReport(data, 'soak'),
        'reports/soak-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
