import { check } from 'k6';
import { createRunProfile } from '../../src/core/runProfile.js';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: { checks: ['rate==1'] }
};

const profile = createRunProfile({
    name: 'contract',
    options: { scenarios: { contract: { executor: 'shared-iterations', vus: 1, iterations: 1 } } },
    metadata: { intent: 'verify lifecycle contract', workload: 'fixture-read' },
    summaryExtension: () => ({ analysis: { verdict: 'contract' } })
});

const passingSummary = {
    metrics: {
        http_reqs: { values: { count: 1, rate: 1 } },
        http_req_failed: { values: { rate: 0 } },
        checks: { values: { rate: 1 } },
        http_req_duration: {
            values: { avg: 10, min: 10, max: 10, 'p(90)': 10, 'p(95)': 10, 'p(99)': 10 },
            thresholds: { 'p(95)<100': { ok: true } }
        },
        iterations: { values: { count: 1 } },
        data_received: { values: { count: 1 } },
        data_sent: { values: { count: 1 } }
    }
};

export default function () {
    const context = profile.setup();
    const reports = profile.handleSummary(passingSummary);
    const html = reports['reports/contract-report.html'];
    const json = JSON.parse(reports['reports/contract-summary.json']);
    const controlledTarget = __ENV.EXPECT_PUBLIC_TARGET_REDACTED === 'true';
    const expectedTargetKind = __ENV.TARGET_KIND || 'unspecified';
    const expectedRunId = __ENV.RUN_ID || 'local';
    profile.teardown(context);

    check({ context, reports, json }, {
        'profile options preserve executor and standard stats': () => profile.options.scenarios.contract.executor === 'shared-iterations'
            && profile.options.summaryTrendStats.includes('p(95)'),
        'setup exposes run context': (result) => result.context.profile === 'contract'
            && result.context.target === __ENV.BASE_URL
            && Number.isInteger(result.context.startTime),
        'reports use stable paths and threshold result': (result) => typeof result.reports['reports/contract-report.html'] === 'string'
            && result.reports['reports/contract-report.html'].includes(`Target kind: ${expectedTargetKind}`)
            && result.json.result.status === 'passed',
        'public HTML redacts controlled targets while preserving legitimate output': () => controlledTarget
            ? (!html.includes(__ENV.BASE_URL)
                && html.includes('[target redacted]')
                && json.profile.target === __ENV.BASE_URL)
            : html.includes(__ENV.BASE_URL),
        'summary carries declared profile metadata': (result) => result.json.profile.name === 'contract'
            && result.json.profile.runId === expectedRunId
            && result.json.profile.targetKind === expectedTargetKind
            && result.json.profile.intent === 'verify lifecycle contract'
            && result.json.profile.workload === 'fixture-read'
            && result.json.analysis.verdict === 'contract'
    });
}
