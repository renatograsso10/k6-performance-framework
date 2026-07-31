import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../../', import.meta.url);
const compose = await readFile(new URL('lab/docker-compose.yml', root), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const workflow = await readFile(new URL('.github/workflows/k6-tests.yml', root), 'utf8');

assert.match(
    compose,
    /SivaramPg\/swapi\.info\.git#f272a7e88e801057588d137d1343b04098811343/,
    'lab must pin the official SWAPI source revision'
);
assert.match(compose, /127\.0\.0\.1:3000:80/, 'lab must bind SWAPI only to loopback');
assert.match(compose, /healthcheck:/, 'lab must declare a health check');
assert.equal(packageJson.scripts['lab:up'], 'node scripts/swapi-lab.mjs up');
assert.equal(packageJson.scripts['lab:down'], 'node scripts/swapi-lab.mjs down');
assert.equal(packageJson.scripts['lab:load'], 'node scripts/swapi-lab.mjs run load');
for (const profile of ['load', 'stress', 'spike', 'soak', 'endurance', 'breakpoint']) {
    assert.equal(packageJson.scripts[`lab:${profile}`], `node scripts/swapi-lab.mjs run ${profile}`);
}
assert.match(workflow, /cron:\s*'0 14 \* \* 0'/, 'weekly controlled load schedule is required');
assert.match(workflow, /npm run lab:load/, 'scheduled load must use the self-hosted lab');
assert.match(workflow, /- 'lab\/\*\*'/, 'lab changes must trigger workflow validation');
assert.match(
    workflow,
    /needs:\s*\[[^\]]*scheduled-load-lab[^\]]*\]/,
    'summary must wait for the scheduled lab'
);
assert.match(workflow, /needs\.scheduled-load-lab\.result/, 'summary must report the scheduled lab outcome');

for (const profile of ['smoke', 'load', 'stress', 'spike', 'soak', 'endurance', 'breakpoint']) {
    const dryRun = spawnSync(process.execPath, ['scripts/swapi-lab.mjs', 'run', profile, '--dry-run'], {
        cwd: new URL('.', root),
        encoding: 'utf8'
    });
    assert.equal(dryRun.status, 0, dryRun.stderr);
    const plan = JSON.parse(dryRun.stdout);
    assert.equal(plan.profile, profile);
    assert.equal(plan.baseUrl, 'http://127.0.0.1:3000');
    assert.equal(plan.targetKind, 'self-hosted-local');
    assert.equal(plan.teardown, true);
}

console.log('self-hosted lab contract: ok');
