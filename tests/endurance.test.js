/**
 * Endurance Test - Long duration stability (2+ hours)
 */

import { group, sleep, check } from 'k6';
import { getThresholds } from '../src/config/thresholds.js';
import { getEnvironment } from '../src/config/environments.js';
import { peopleApi } from '../src/api/peopleApi.js';
import { planetsApi } from '../src/api/planetsApi.js';
import { starshipsApi } from '../src/api/starshipsApi.js';
import { filmsApi } from '../src/api/filmsApi.js';
import { logger } from '../src/core/logger.js';
import { generateHtmlReport, generateJsonSummary } from '../src/core/reporter.js';
import { recordApiMetrics, checkpointCount } from '../src/core/metrics.js';

const enduranceDuration = (typeof __ENV !== 'undefined' && __ENV.ENDURANCE_DURATION)
    ? __ENV.ENDURANCE_DURATION : '2h';

export const options = {
    stages: [
        { duration: '5m', target: 30 },
        { duration: enduranceDuration, target: 30 },
        { duration: '5m', target: 0 }
    ],
    thresholds: getThresholds('endurance'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();
let testStartTime;

export function setup() {
    logger.info('Starting ENDURANCE Test', {
        testType: 'endurance',
        environment: environment.baseUrl,
        duration: enduranceDuration
    });
    testStartTime = Date.now();
    return { startTime: testStartTime };
}

export default function (data) {
    const elapsed = (Date.now() - data.startTime) / 1000 / 60;

    // Checkpoint every 15 minutes
    if (Math.floor(elapsed) % 15 === 0 && __ITER === 0) {
        checkpointCount.add(1);
        logger.info(`Checkpoint at ${Math.floor(elapsed)} minutes`);
    }

    const endpoints = [
        () => peopleApi.get(Math.floor(Math.random() * 10) + 1),
        () => planetsApi.get(Math.floor(Math.random() * 10) + 1),
        () => starshipsApi.get(Math.floor(Math.random() * 10) + 1),
        () => filmsApi.get(Math.floor(Math.random() * 6) + 1)
    ];

    group('Endurance Operations', () => {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const resp = endpoint();

        check(resp, { 'status ok': (r) => r.status === 200 });
        recordApiMetrics('endurance.request', resp.timings.duration, resp.status === 200, resp.status);
    });

    sleep(0.5);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('ENDURANCE Test Complete', { duration: `${(duration / 3600).toFixed(2)} hours` });
}

export function handleSummary(data) {
    return {
        'reports/endurance-report.html': generateHtmlReport(data, 'endurance'),
        'reports/endurance-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
