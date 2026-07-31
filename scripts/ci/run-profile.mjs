import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { isHeavyProfile } from '../../src/config/profileCatalog.js';
import { assertTargetAllowed } from '../../src/config/targetPolicy.js';

const [profile, ...flags] = process.argv.slice(2);

function buildPlan() {
    if (flags.some((flag) => flag !== '--dry-run')) {
        throw new Error(`Unsupported option: ${flags.find((flag) => flag !== '--dry-run')}`);
    }

    const heavyProfile = isHeavyProfile(profile);
    const supported = profile === 'smoke' || profile === 'external-smoke' || heavyProfile;
    if (!supported) throw new Error(`Unsupported CI profile: ${profile || '<missing>'}`);

    if (heavyProfile) {
        const baseUrl = process.env.BASE_URL;
        if (!baseUrl) throw new Error('Heavy profiles require a controlled BASE_URL');
        assertTargetAllowed(profile, baseUrl, Number(process.env.MAX_RETRIES || 0));
    }

    const exporters = ['json'];
    if (
        heavyProfile
        && process.env.SEND_TO_GRAFANA === 'true'
        && process.env.K6_PROMETHEUS_RW_PASSWORD
    ) {
        exporters.push('experimental-prometheus-rw');
    }

    return {
        profile,
        mode: profile === 'smoke' ? 'fixture' : 'direct',
        script: `tests/${profile}.test.js`,
        result: `reports/${profile}-results.json`,
        exporters,
        ...(profile === 'smoke' ? { iterations: 1 } : {})
    };
}

function execute(plan) {
    mkdirSync('reports', { recursive: true });
    const outputArgs = plan.exporters.flatMap((exporter) => [
        '--out',
        exporter === 'json' ? `json=${plan.result}` : exporter
    ]);
    const executable = plan.mode === 'fixture'
        ? process.execPath
        : process.platform === 'win32' ? 'k6.exe' : 'k6';
    const args = plan.mode === 'fixture'
        ? ['scripts/run-k6-with-fixture.mjs', plan.script, '--iterations', String(plan.iterations), ...outputArgs]
        : ['run', plan.script, ...outputArgs];
    const result = spawnSync(executable, args, { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
}

try {
    const plan = buildPlan();
    if (flags.includes('--dry-run')) {
        process.stdout.write(`${JSON.stringify(plan)}\n`);
    } else {
        execute(plan);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 2;
}
