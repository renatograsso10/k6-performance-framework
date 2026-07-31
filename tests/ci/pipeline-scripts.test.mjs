import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(.:)/, '$1'));

function run(script, args = [], env = {}) {
    return spawnSync(process.execPath, [script, ...args], {
        cwd: root,
        env: { ...process.env, ...env },
        encoding: 'utf8'
    });
}

const allProfiles = run('scripts/ci/select-profiles.mjs', ['all', '--dry-run']);
assert.equal(allProfiles.status, 0, allProfiles.stderr);
assert.deepEqual(JSON.parse(allProfiles.stdout), {
    profiles: ['load', 'stress', 'spike', 'soak', 'endurance', 'breakpoint']
});

const oneProfile = run('scripts/ci/select-profiles.mjs', ['spike', '--dry-run']);
assert.equal(oneProfile.status, 0, oneProfile.stderr);
assert.deepEqual(JSON.parse(oneProfile.stdout), { profiles: ['spike'] });

const invalidProfile = run('scripts/ci/select-profiles.mjs', ['smoke', '--dry-run']);
assert.equal(invalidProfile.status, 2);
assert.match(invalidProfile.stderr, /Unsupported heavy profile: smoke/);

const fixtureRun = run('scripts/ci/run-profile.mjs', ['smoke', '--dry-run']);
assert.equal(fixtureRun.status, 0, fixtureRun.stderr);
assert.deepEqual(JSON.parse(fixtureRun.stdout), {
    profile: 'smoke',
    mode: 'fixture',
    script: 'tests/smoke.test.js',
    result: 'reports/smoke-results.json',
    exporters: ['json'],
    iterations: 1
});

const externalRun = run('scripts/ci/run-profile.mjs', ['external-smoke', '--dry-run']);
assert.equal(externalRun.status, 0, externalRun.stderr);
assert.equal(JSON.parse(externalRun.stdout).mode, 'direct');

const packageManifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.match(packageManifest.scripts['external-smoke'], /--env TARGET_KIND=public-cdn/);
assert.match(packageManifest.scripts['external-smoke'], /--env MAX_RETRIES=0/);
for (const profile of ['smoke', 'load', 'stress', 'spike', 'soak']) {
    assert.match(
        packageManifest.scripts[profile],
        /--env TARGET_KIND=controlled-remote/,
        `${profile} launcher must classify its controlled target`
    );
}

const grafanaRun = run('scripts/ci/run-profile.mjs', ['load', '--dry-run'], {
    BASE_URL: 'https://controlled.example.test',
    SEND_TO_GRAFANA: 'true',
    K6_PROMETHEUS_RW_PASSWORD: 'configured'
});
assert.equal(grafanaRun.status, 0, grafanaRun.stderr);
assert.deepEqual(JSON.parse(grafanaRun.stdout).exporters, ['json', 'experimental-prometheus-rw']);

const unsafeHeavyRun = run('scripts/ci/run-profile.mjs', ['stress', '--dry-run'], {
    BASE_URL: 'https://swapi.info'
});
assert.equal(unsafeHeavyRun.status, 2);
assert.match(unsafeHeavyRun.stderr, /controlled BASE_URL/);

const successfulSummary = run('scripts/ci/generate-summary.mjs', ['--dry-run'], {
    VALIDATION: 'success',
    SMOKE: 'success',
    EXTERNAL_JOB: 'skipped',
    EXTERNAL_TEST: '',
    LAB: 'skipped',
    PERFORMANCE: 'skipped'
});
assert.equal(successfulSummary.status, 0, successfulSummary.stderr);
const successfulPlan = JSON.parse(successfulSummary.stdout);
assert.equal(successfulPlan.publishable, true);
assert.match(successfulPlan.markdown, /\| fixture smoke \| success \|/);
assert.match(successfulPlan.markdown, /\| self-hosted scheduled load \| skipped \|/);

const failedSummary = run('scripts/ci/generate-summary.mjs', ['--dry-run'], {
    VALIDATION: 'failure',
    SMOKE: 'success',
    EXTERNAL_JOB: 'skipped',
    EXTERNAL_TEST: '',
    LAB: 'skipped',
    PERFORMANCE: 'skipped'
});
assert.equal(failedSummary.status, 0, failedSummary.stderr);
assert.equal(JSON.parse(failedSummary.stdout).publishable, false);

const partiallyFailedSummary = run('scripts/ci/generate-summary.mjs', ['--dry-run'], {
    VALIDATION: 'success',
    SMOKE: 'success',
    EXTERNAL_JOB: 'skipped',
    EXTERNAL_TEST: '',
    LAB: 'skipped',
    PERFORMANCE: 'failure'
});
assert.equal(partiallyFailedSummary.status, 0, partiallyFailedSummary.stderr);
assert.equal(
    JSON.parse(partiallyFailedSummary.stdout).publishable,
    false,
    'one successful report must not publish artifacts from a failed blocking job'
);

const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'k6-publish-contract-'));
try {
    const source = path.join(temporaryRoot, 'artifacts');
    const destination = path.join(temporaryRoot, 'pages');
    await mkdir(path.join(source, 'smoke'), { recursive: true });
    await mkdir(path.join(source, 'load'), { recursive: true });
    await writeFile(path.join(source, 'smoke', 'smoke-report.html'), '<h1>smoke</h1>');
    await writeFile(path.join(source, 'load', 'load-report.html'), '<h1>load</h1>');

    const dryDestination = path.join(temporaryRoot, 'dry-pages');
    const dryPublication = run('scripts/ci/publish-reports.mjs', [
        '--source', source,
        '--destination', dryDestination,
        '--run-number', '42',
        '--dry-run'
    ]);
    assert.equal(dryPublication.status, 0, dryPublication.stderr);
    assert.deepEqual(JSON.parse(dryPublication.stdout), {
        runDirectory: 'run-42',
        reports: ['load-report.html', 'smoke-report.html']
    });
    await assert.rejects(access(dryDestination), { code: 'ENOENT' });
    await writeFile(path.join(source, 'load', 'report&name.html'), '<h1>encoded name</h1>');

    const publication = run('scripts/ci/publish-reports.mjs', [
        '--source', source,
        '--destination', destination,
        '--run-number', '42'
    ]);
    assert.equal(publication.status, 0, publication.stderr);
    await access(path.join(destination, 'run-42', 'smoke-report.html'));
    await access(path.join(destination, 'run-42', 'load-report.html'));
    await access(path.join(destination, 'run-42', 'report&name.html'));
    const runIndex = await readFile(path.join(destination, 'run-42', 'index.html'), 'utf8');
    const rootIndex = await readFile(path.join(destination, 'index.html'), 'utf8');
    assert.match(runIndex, /run #42/);
    assert.match(runIndex, /href="load-report\.html"/);
    assert.match(runIndex, /href="smoke-report\.html"/);
    assert.match(runIndex, /href="report%26name\.html">report&amp;name\.html<\/a>/);
    assert.match(rootIndex, /url=run-42\//);
} finally {
    await rm(temporaryRoot, { recursive: true, force: true });
}

console.log('pipeline scripts: ok');
