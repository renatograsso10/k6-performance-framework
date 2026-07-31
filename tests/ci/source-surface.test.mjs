import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(new URL('../..', import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const removedModules = [
    'src/config/options.js',
    'src/config/grafana.js',
    'src/data/testData.js',
    'src/utils/helpers.js',
    'src/utils/tags.js',
    'src/utils/checks.js',
    'src/api/peopleApi.js',
    'src/api/planetsApi.js',
    'src/api/starshipsApi.js',
    'src/api/filmsApi.js',
    'src/config/slos.js'
];

for (const modulePath of removedModules) {
    await assert.rejects(access(path.join(root, modulePath)), { code: 'ENOENT' }, `${modulePath} must be removed`);
}

const sourceRoot = path.join(root, 'src');
const sourceFiles = (await readdir(sourceRoot, { recursive: true }))
    .filter((name) => name.endsWith('.js'));
for (const sourceFile of sourceFiles) {
    const content = await readFile(path.join(sourceRoot, sourceFile), 'utf8');
    assert.doesNotMatch(content, /export default/, `${sourceFile} exposes an unused default export`);
    assert.doesNotMatch(content, /export const httpClient\b/, `${sourceFile} exposes an unused singleton`);
}

const metricsSource = await readFile(path.join(root, 'src/core/metrics.js'), 'utf8');
for (const unusedMetric of [
    'auth_response_time', 'users_response_time', 'resources_response_time', 'timeout_errors',
    'business_transactions', 'cache_hit_rate', 'active_users', 'queue_size'
]) {
    assert.doesNotMatch(metricsSource, new RegExp(`['"]${unusedMetric}['"]`), `${unusedMetric} has no producer`);
}

const topLevelTests = (await readdir(path.join(root, 'tests')))
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => `tests/${name}`);
const entrypoints = [...topLevelTests, 'tests/regression/source-imports.test.js'];
const k6 = process.platform === 'win32' ? 'k6.exe' : 'k6';

const performanceProfiles = ['smoke', 'load', 'stress', 'spike', 'soak', 'endurance', 'breakpoint'];
for (const profile of performanceProfiles) {
    const content = await readFile(path.join(root, `tests/${profile}.test.js`), 'utf8');
    assert.match(content, /createRunProfile/, `${profile} bypasses shared run lifecycle`);
    assert.doesNotMatch(content, /src\/api\//, `${profile} bypasses the SWAPI workload`);
    assert.doesNotMatch(content, /\bcheck\s*[,}]/, `${profile} owns checks that belong to the workload`);
}

const externalSmoke = await readFile(path.join(root, 'tests/external-smoke.test.js'), 'utf8');
assert.match(externalSmoke, /createRunProfile/, 'external-smoke bypasses shared run lifecycle');

for (const entrypoint of entrypoints) {
    const result = spawnSync(k6, ['inspect', entrypoint], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, `${entrypoint} failed k6 inspect:\n${result.stderr || result.stdout}`);
}

console.log(`source surface: ${entrypoints.length} entrypoints valid`);
