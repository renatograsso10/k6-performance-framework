/**
 * Stress Test - Push beyond normal load
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
        { duration: '2m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '3m', target: 300 },
        { duration: '3m', target: 400 },
        { duration: '3m', target: 500 },
        { duration: '2m', target: 0 }
    ],
    thresholds: getThresholds('stress'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting STRESS Test', { testType: 'stress', environment: environment.baseUrl });
    return { startTime: Date.now() };
}

export default function () {
    const isPeople = Math.random() < 0.5;

    group(isPeople ? 'People API' : 'Planets API', () => {
        const id = Math.floor(Math.random() * 10) + 1;
        const resp = isPeople ? peopleApi.get(id) : planetsApi.get(id);

        check(resp, { 'status ok': (r) => r.status === 200 });
        recordApiMetrics(isPeople ? 'people.get' : 'planets.get', resp.timings.duration, resp.status === 200, resp.status);
    });

    sleep(0.2);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('STRESS Test Complete', { duration: `${(duration / 60).toFixed(1)} min` });
}

export function handleSummary(data) {
    return {
        'reports/stress-report.html': generateHtmlReport(data, 'stress'),
        'reports/stress-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
