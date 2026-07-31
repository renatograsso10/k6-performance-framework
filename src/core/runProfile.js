import { getEnvironment } from '../config/environments.js';
import { assertTargetAllowed } from '../config/targetPolicy.js';
import { createJsonReport } from './jsonReport.js';
import { logger } from './logger.js';
import { createReportModel } from './reportModel.js';
import { renderHtmlReport } from './reporter.js';
import { getRunId, getTargetKind } from './telemetry.js';

const SUMMARY_TREND_STATS = Object.freeze(['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)']);
const PUBLIC_TARGET_KINDS = new Set(['fixture', 'self-hosted-local', 'public-cdn']);

export function createRunProfile({ name, options, metadata = {}, summaryExtension }) {
    if (!name || !options) throw new Error('Run profile requires name and options');

    const environment = getEnvironment();
    const runId = getRunId();
    const targetKind = getTargetKind();
    const profileOptions = {
        ...options,
        summaryTrendStats: options.summaryTrendStats || SUMMARY_TREND_STATS
    };

    function setup() {
        assertTargetAllowed(name, environment.baseUrl, environment.maxRetries);
        const context = {
            startTime: Date.now(),
            profile: name,
            target: environment.baseUrl,
            runId,
            targetKind
        };
        logger.info(`Starting ${name.toUpperCase()} test`, { ...context, ...metadata });
        return context;
    }

    function teardown(context) {
        const durationSeconds = Math.max(0, (Date.now() - context.startTime) / 1000);
        logger.info(`Completed ${name.toUpperCase()} test`, {
            profile: name,
            target: context.target,
            durationSeconds
        });
    }

    function handleSummary(data) {
        const reportModel = createReportModel(data, {
            testType: name,
            targetUrl: environment.baseUrl,
            targetKind,
            runId
        });
        const jsonSummary = createJsonReport(reportModel);
        jsonSummary.profile = { name, target: environment.baseUrl, targetKind, runId, ...metadata };
        if (summaryExtension) Object.assign(jsonSummary, summaryExtension(data));
        const publicReportModel = PUBLIC_TARGET_KINDS.has(targetKind)
            ? reportModel
            : { ...reportModel, context: { ...reportModel.context, targetUrl: '[target redacted]' } };

        return {
            [`reports/${name}-report.html`]: renderHtmlReport(publicReportModel),
            [`reports/${name}-summary.json`]: JSON.stringify(jsonSummary, null, 2)
        };
    }

    return {
        name,
        metadata: { ...metadata },
        options: profileOptions,
        setup,
        teardown,
        handleSummary
    };
}
