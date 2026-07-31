import { appendFile } from 'node:fs/promises';

const statuses = {
    validation: process.env.VALIDATION || 'skipped',
    smoke: process.env.SMOKE || 'skipped',
    externalJob: process.env.EXTERNAL_JOB || 'skipped',
    externalTest: process.env.EXTERNAL_TEST || 'skipped',
    lab: process.env.LAB || 'skipped',
    performance: process.env.PERFORMANCE || 'skipped'
};

const allowed = new Set(['success', 'failure', 'cancelled', 'skipped']);

try {
    for (const [name, status] of Object.entries(statuses)) {
        if (!allowed.has(status)) throw new Error(`Invalid ${name} outcome: ${status}`);
    }

    const blockingRuns = [statuses.smoke, statuses.lab, statuses.performance]
        .filter((status) => status !== 'skipped');
    const hasSuccessfulReport = blockingRuns.includes('success') || statuses.externalTest === 'success';
    const publishable = statuses.validation === 'success'
        && blockingRuns.every((status) => status === 'success')
        && hasSuccessfulReport;

    const markdown = [
        '## K6 Performance Test Results',
        '',
        '| Job | Outcome |',
        '|---|---|',
        `| validation | ${statuses.validation} |`,
        `| fixture smoke | ${statuses.smoke} |`,
        `| external-smoke job | ${statuses.externalJob} |`,
        `| external-smoke test | ${statuses.externalTest} |`,
        `| self-hosted scheduled load | ${statuses.lab} |`,
        `| heavy profiles | ${statuses.performance} |`,
        ''
    ].join('\n');

    if (process.argv.includes('--dry-run')) {
        process.stdout.write(`${JSON.stringify({ publishable, markdown })}\n`);
    } else {
        if (!process.env.GITHUB_STEP_SUMMARY || !process.env.GITHUB_OUTPUT) {
            throw new Error('GITHUB_STEP_SUMMARY and GITHUB_OUTPUT are required');
        }
        await Promise.all([
            appendFile(process.env.GITHUB_STEP_SUMMARY, markdown),
            appendFile(process.env.GITHUB_OUTPUT, `publishable=${publishable}\n`)
        ]);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 2;
}
