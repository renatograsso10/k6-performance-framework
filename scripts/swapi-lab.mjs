import { spawn } from 'node:child_process';
import { HEAVY_PROFILES } from '../src/config/profileCatalog.js';

const LAB_URL = 'http://127.0.0.1:3000';
const COMPOSE_FILE = 'lab/docker-compose.yml';
const PROFILES = new Set(['smoke', ...HEAVY_PROFILES]);
const [action, profile, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

function command(executable, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(executable, args, { stdio: 'inherit' });
        child.once('error', reject);
        child.once('exit', (code) => code === 0
            ? resolve()
            : reject(new Error(`${executable} exited with code ${code}`)));
    });
}

function compose(...args) {
    return command('docker', ['compose', '-f', COMPOSE_FILE, ...args]);
}

async function up() {
    await compose('up', '--detach', '--build', '--wait');
}

async function down() {
    await compose('down', '--remove-orphans');
}

async function run(runProfile) {
    if (!PROFILES.has(runProfile)) {
        throw new Error(`Unsupported lab profile: ${runProfile || '<missing>'}`);
    }

    if (dryRun) {
        process.stdout.write(`${JSON.stringify({
            profile: runProfile,
            baseUrl: LAB_URL,
            targetKind: 'self-hosted-local',
            teardown: true
        })}\n`);
        return;
    }

    let runError;
    try {
        await up();
        const k6 = process.platform === 'win32' ? 'k6.exe' : 'k6';
        await command(k6, [
            'run',
            '--env', `BASE_URL=${LAB_URL}`,
            '--env', 'TARGET_KIND=self-hosted-local',
            '--env', `RUN_ID=lab-${Date.now()}`,
            `tests/${runProfile}.test.js`
        ]);
    } catch (error) {
        runError = error;
    }

    try {
        await down();
    } catch (error) {
        if (!runError) throw error;
        console.error(`Lab cleanup failed: ${error.message}`);
    }

    if (runError) throw runError;
}

try {
    if (action === 'up') await up();
    else if (action === 'down') await down();
    else if (action === 'run') await run(profile);
    else throw new Error(`Usage: node scripts/swapi-lab.mjs <up|down|run ${[...PROFILES].join('|')}> [--dry-run]`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
