/**
 * Smoke Test - Quick validation with SWAPI
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
        { duration: '30s', target: 2 },
        { duration: '1m', target: 3 },
        { duration: '30s', target: 0 }
    ],
    thresholds: getThresholds('smoke'),
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']
};

const environment = getEnvironment();

export function setup() {
    logger.info('Starting SMOKE Test', { testType: 'smoke', environment: environment.baseUrl });
    return { startTime: Date.now(), testType: 'smoke' };
}

export default function () {
    group('People API', () => {
        const listResp = peopleApi.list(1);
        check(listResp, { 'list people ok': (r) => r.status === 200 });
        recordApiMetrics('people.list', listResp.timings.duration, listResp.status === 200, listResp.status);
        sleep(0.3);

        const id = Math.floor(Math.random() * 10) + 1;
        const getResp = peopleApi.get(id);
        check(getResp, { 'get person ok': (r) => r.status === 200 });
        recordApiMetrics('people.get', getResp.timings.duration, getResp.status === 200, getResp.status);
        sleep(0.3);
    });

    group('Planets API', () => {
        const listResp = planetsApi.list(1);
        check(listResp, { 'list planets ok': (r) => r.status === 200 });
        recordApiMetrics('planets.list', listResp.timings.duration, listResp.status === 200, listResp.status);
        sleep(0.3);
    });

    group('Starships API', () => {
        const listResp = starshipsApi.list(1);
        check(listResp, { 'list starships ok': (r) => r.status === 200 });
        recordApiMetrics('starships.list', listResp.timings.duration, listResp.status === 200, listResp.status);
        sleep(0.3);
    });

    group('Films API', () => {
        const listResp = filmsApi.list();
        check(listResp, { 'list films ok': (r) => r.status === 200 });
        recordApiMetrics('films.list', listResp.timings.duration, listResp.status === 200, listResp.status);
    });

    sleep(0.5);
}

export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    logger.info('SMOKE Test Complete', { testType: 'smoke', duration: `${duration.toFixed(1)}s` });
}

export function handleSummary(data) {
    const jsonSummary = generateJsonSummary(data);

    console.log('\n' + '='.repeat(50));
    console.log('SMOKE TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
    console.log(`Error Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%`);
    console.log(`p95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms`);
    console.log('='.repeat(50) + '\n');

    return {
        'reports/smoke-report.html': generateHtmlReport(data, 'smoke'),
        'reports/smoke-summary.json': JSON.stringify(jsonSummary, null, 2)
    };
}
