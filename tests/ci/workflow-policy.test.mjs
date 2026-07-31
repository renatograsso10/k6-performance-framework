import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../../.github/workflows/k6-tests.yml', import.meta.url), 'utf8');

assert.match(workflow, /K6_VERSION:\s*'1\.5\.0'/, 'k6 version must be pinned');
assert.match(workflow, /uses:\s*grafana\/setup-k6-action@[0-9a-f]{40}/, 'official pinned k6 setup action must be used');
assert.match(workflow, /cron:\s*'0 14 \* \* \*'/, 'daily public probe schedule is required');
assert.match(workflow, /node scripts\/ci\/run-profile\.mjs external-smoke/, 'schedule must run external-smoke through the executor');
assert.match(workflow, /continue-on-error:\s*true/, 'public probe must not block CI');
assert.doesNotMatch(
    workflow,
    /\$\{EXTERNAL_TEST:-success\}.*!=.*failure/,
    'public probe failure must not block report publication'
);
assert.match(
    workflow,
    /node scripts\/ci\/run-profile\.mjs smoke/,
    'PR smoke must use deterministic fixture'
);
assert.match(workflow, /max-parallel:\s*1/, 'heavy profiles must be serialized');
assert.match(workflow, /load, stress, spike, soak, endurance, breakpoint/, 'heavy profile matrix is incomplete');
assert.doesNotMatch(workflow, /^\s{2}(load|stress|spike|soak|endurance|breakpoint)-test:/m, 'copied heavy jobs are forbidden');
assert.match(workflow, /permissions:\s*\r?\n\s+contents:\s*read/, 'default workflow permissions must be read-only');
assert.match(workflow, /node scripts\/ci\/run-profile\.mjs "\$\{\{ matrix\.profile \}\}"/, 'heavy profiles must use the shared executor');
assert.match(workflow, /needs\.(validation|smoke-fixture|performance)\.result/, 'summary must use real job outcomes');
assert.match(workflow, /node scripts\/ci\/select-profiles\.mjs/, 'profile selection must use tested CLI');
assert.match(workflow, /node scripts\/ci\/generate-summary\.mjs/, 'run summary must use tested CLI');
assert.match(workflow, /node scripts\/ci\/publish-reports\.mjs/, 'report publication must use tested CLI');
assert.doesNotMatch(workflow, /echo 'profiles=/, 'profile-selection implementation must not live in YAML');
assert.doesNotMatch(workflow, /find all-results -type f/, 'report-copy implementation must not live in YAML');
assert.doesNotMatch(workflow, /<!doctype html>/, 'report HTML implementation must not live in YAML');
assert.doesNotMatch(workflow, /\bk6 run\b/, 'profile execution implementation must not live in YAML');
assert.doesNotMatch(workflow, /scripts\/run-k6-with-fixture\.mjs/, 'fixture execution implementation must not live in YAML');
assert.match(workflow, /keep_files:\s*false/, 'Pages must replace the previous publication to bound branch growth');
assert.doesNotMatch(workflow, /keep_files:\s*true/, 'unbounded Pages history is forbidden');
assert.match(workflow, /force_orphan:\s*true/, 'Pages branch must retain only its latest deployment commit');

console.log('workflow policy: ok');
