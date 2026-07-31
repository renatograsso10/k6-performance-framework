import { check } from 'k6';
import { createJsonReport } from '../../src/core/jsonReport.js';
import { createReportModel } from '../../src/core/reportModel.js';
import { renderHtmlReport } from '../../src/core/reporter.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

function summaryData({ requests = 1, thresholdOk = true, includeThreshold = true } = {}) {
    const durationMetric = {
        type: 'trend',
        contains: 'time',
        values: { avg: 100, min: 80, med: 95, max: 120, 'p(90)': 110, 'p(95)': 115, 'p(99)': 120 }
    };
    if (includeThreshold) {
        durationMetric.thresholds = { 'p(95)<2000': { ok: thresholdOk } };
    }

    return {
        metrics: {
            http_reqs: { values: { count: requests, rate: requests } },
            http_req_failed: { values: { rate: 0 } },
            checks: { values: { rate: 1 } },
            http_req_duration: durationMetric,
            iterations: { values: { count: requests } },
            data_received: { values: { count: 100 } },
            data_sent: { values: { count: 50 } }
        }
    };
}

export default function () {
    const passingData = summaryData();
    const failingData = summaryData({ thresholdOk: false });
    const emptyData = summaryData({ requests: 0, includeThreshold: false });

    const context = { testType: 'smoke', targetUrl: 'https://fixture.invalid' };
    const passingModel = createReportModel(passingData, context);
    const failingModel = createReportModel(failingData, context);
    const emptyModel = createReportModel(emptyData, context);
    const passingJson = createJsonReport(passingModel);
    const failingJson = createJsonReport(failingModel);
    const emptyJson = createJsonReport(emptyModel);
    const passingHtml = renderHtmlReport(passingModel);
    const failingHtml = renderHtmlReport(failingModel);
    const emptyHtml = renderHtmlReport(emptyModel);
    const legacySloHtml = renderHtmlReport(createReportModel(passingData, { ...context, sloType: 'read_apis' }));

    check({ passingJson, failingJson, emptyJson, passingHtml, failingHtml, emptyHtml, legacySloHtml }, {
        'passing thresholds define PASS': (result) => result.passingJson.result.status === 'passed'
            && result.passingJson.result.thresholds.failed === 0
            && result.passingHtml.includes('data-test-status="passed"'),
        'failed threshold defines FAIL': (result) => result.failingJson.result.status === 'failed'
            && result.failingJson.result.thresholds.failed === 1
            && result.failingHtml.includes('data-test-status="failed"'),
        'metric indicators use threshold outcome': (result) => result.passingHtml.includes('data-metric="http_req_duration" data-threshold-status="passed"')
            && result.failingHtml.includes('data-metric="http_req_duration" data-threshold-status="failed"')
            && result.failingHtml.includes('data-metric="http_req_failed" data-threshold-status="unknown"'),
        'zero requests never report PASS': (result) => result.emptyJson.result.status === 'no_data'
            && result.emptyHtml.includes('data-test-status="no_data"'),
        'SLO is absent without a real configured objective': (result) => !result.passingHtml.includes('SLO Status')
            && !result.passingHtml.includes('Error Budget')
            && !result.legacySloHtml.includes('SLO Status')
            && !result.legacySloHtml.includes('Error Budget')
    });
}
