/**
 * Load Test - Normal expected traffic simulation
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
import { recordApiMetrics } from '../src/core/metrics.js';

export const options = {
    stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 }
    ],
    thresholds: getThresholds('load'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting LOAD Test', { testType: 'load', environment: environment.baseUrl });
    return { startTime: Date.now() };
}

export default function () {
    const endpoints = ['people', 'planets', 'starships', 'films'];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    group(`${endpoint} API`, () => {
        let resp;
        const id = Math.floor(Math.random() * 10) + 1;

        switch (endpoint) {
            case 'people':
                resp = peopleApi.get(id);
                break;
            case 'planets':
                resp = planetsApi.get(id);
                break;
            case 'starships':
                resp = starshipsApi.get(id);
                break;
            case 'films':
                resp = filmsApi.get(Math.min(id, 6));
                break;
        }

        check(resp, { 'status ok': (r) => r.status === 200 });
        recordApiMetrics(`${endpoint}.get`, resp.timings.duration, resp.status === 200, resp.status);
    });

    sleep(0.3);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('LOAD Test Complete', { duration: `${(duration / 60).toFixed(1)} min` });
}

export function handleSummary(data) {
    return {
        'reports/load-report.html': generateHtmlReport(data, 'load'),
        'reports/load-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
