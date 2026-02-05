/**
 * Breakpoint Test - Finds system's maximum capacity
 */

import { sleep, check, group } from 'k6';
import { getEnvironment } from '../src/config/environments.js';
import { peopleApi } from '../src/api/peopleApi.js';
import { planetsApi } from '../src/api/planetsApi.js';
import { logger } from '../src/core/logger.js';
import { generateHtmlReport, generateJsonSummary } from '../src/core/reporter.js';
import { recordApiMetrics } from '../src/core/metrics.js';

export const options = {
    stages: [
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 700 },
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 0 }
    ],
    thresholds: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed': ['rate<0.15'],
        'checks': ['rate>0.80']
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting BREAKPOINT Test', { testType: 'breakpoint', environment: environment.baseUrl });
    return { startTime: Date.now() };
}

export default function () {
    const endpoint = Math.random() < 0.5 ? 'people' : 'planets';

    if (endpoint === 'people') {
        group('People Operations', () => {
            const id = Math.floor(Math.random() * 10) + 1;
            const resp = peopleApi.get(id);
            const passed = check(resp, { 'status ok': (r) => r.status === 200 });
            recordApiMetrics('people.get', resp.timings.duration, passed, resp.status);
        });
    } else {
        group('Planets Operations', () => {
            const id = Math.floor(Math.random() * 10) + 1;
            const resp = planetsApi.get(id);
            const passed = check(resp, { 'status ok': (r) => r.status === 200 });
            recordApiMetrics('planets.get', resp.timings.duration, passed, resp.status);
        });
    }

    sleep(Math.random() * 0.5 + 0.2);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('BREAKPOINT Test Complete', { duration: `${(duration / 60).toFixed(1)} min` });
}

export function handleSummary(data) {
    const metrics = data.metrics || {};
    const p95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
    const errorRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
    const reqRate = metrics.http_reqs?.values?.rate || 0;

    let conclusion = errorRate > 15 ? 'System limit reached - high error rate' :
        p95 > 3000 ? 'Latency degradation detected' :
            'System healthy at tested load';

    console.log('\n' + '='.repeat(50));
    console.log('BREAKPOINT ANALYSIS');
    console.log('='.repeat(50));
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`p95 Latency: ${p95.toFixed(0)}ms`);
    console.log(`Throughput: ${reqRate.toFixed(2)} req/s`);
    console.log(`>> ${conclusion}`);
    console.log('='.repeat(50) + '\n');

    return {
        'reports/breakpoint-report.html': generateHtmlReport(data, 'breakpoint'),
        'reports/breakpoint-summary.json': JSON.stringify(generateJsonSummary(data), null, 2)
    };
}
