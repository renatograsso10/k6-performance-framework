import { check } from 'k6';
import { createReportModel } from '../../src/core/reportModel.js';
import { createJsonReport } from '../../src/core/jsonReport.js';
import { renderHtmlReport } from '../../src/core/reporter.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

const data = {
    metrics: {
        http_reqs: { values: { count: 2, rate: 4 } },
        http_req_failed: {
            values: { rate: 0.5 },
            thresholds: { 'rate<0.1': { ok: false } }
        },
        checks: {
            values: { rate: 0.5 },
            thresholds: { 'rate>0.9': { ok: false } }
        },
        http_req_duration: {
            values: { avg: 100, min: 50, med: 90, max: 200, 'p(90)': 150, 'p(95)': 180, 'p(99)': 195 },
            thresholds: { 'p(95)<200': { ok: true } }
        },
        iterations: { values: { count: 2 } },
        data_received: { values: { count: 2048 } },
        data_sent: { values: { count: 1024 } }
    }
};

const taggedThresholdData = {
    metrics: {
        http_reqs: { values: { count: 1, rate: 1 } },
        http_req_duration: { values: { avg: 100, min: 80, max: 120, 'p(90)': 110, 'p(95)': 115, 'p(99)': 120 } },
        'http_req_duration{scenario:vus_0050}': {
            values: { 'p(95)': 115 },
            thresholds: { 'p(95)<100': { ok: false } }
        }
    }
};

export default function () {
    const model = createReportModel(data, {
        testType: 'contract',
        targetUrl: 'https://fixture.invalid',
        targetKind: 'fixture',
        runId: 'report-contract'
    });
    const jsonReport = createJsonReport(model);
    const unsafeModel = createReportModel(data, {
        testType: '<script>alert(1)</script>',
        targetUrl: 'https://fixture.invalid/?q=<script>',
        targetKind: '<img src=x>',
        runId: 'run" onclick="alert(1)'
    });
    const safeHtml = renderHtmlReport(unsafeModel);
    const taggedModel = createReportModel(taggedThresholdData);
    const taggedHtml = renderHtmlReport(taggedModel);

    check({ model, jsonReport, safeHtml, taggedModel, taggedHtml }, {
        'report model owns the threshold verdict': (result) => result.model.result.status === 'failed'
            && result.model.result.thresholds.total === 3
            && result.model.result.thresholds.failed === 2,
        'report model normalizes metrics once': (result) => result.model.summary.totalRequests === 2
            && result.model.summary.requestRate === 4
            && result.model.summary.errorRate === 50
            && result.model.responseTime.p95 === 180
            && result.model.operations.dataReceivedBytes === 2048,
        'report model carries adapter context': (result) => result.model.context.testType === 'contract'
            && result.model.context.targetUrl === 'https://fixture.invalid'
            && result.model.context.targetKind === 'fixture'
            && result.model.context.runId === 'report-contract',
        'JSON adapter preserves normalized verdict': (result) => result.jsonReport.result === result.model.result
            && result.jsonReport.summary.totalRequests === 2
            && result.jsonReport.responseTime.p95 === 180,
        'tagged thresholds drive their base metric indicator': (result) => result.taggedModel.thresholdStatus.duration === 'failed'
            && result.taggedHtml.includes('data-metric="http_req_duration" data-threshold-status="failed"'),
        'HTML adapter escapes external values': (result) => !result.safeHtml.includes('<script>')
            && !result.safeHtml.includes('<img src=x>')
            && result.safeHtml.includes('&lt;script&gt;')
            && result.safeHtml.includes('run&quot; onclick=&quot;alert(1)')
    });
}
