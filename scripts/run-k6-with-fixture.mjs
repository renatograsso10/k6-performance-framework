import { spawn } from 'node:child_process';
import { createSwapiFixture } from '../tests/fixtures/swapi-server.mjs';

const [script, ...k6Args] = process.argv.slice(2);
if (!script) {
    console.error('Usage: node scripts/run-k6-with-fixture.mjs <k6-script> [...k6 args]');
    process.exit(2);
}

const server = createSwapiFixture();
await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

let output = '';
const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'k6.exe' : 'k6', [
        'run',
        '--quiet',
        '--env', `BASE_URL=${baseUrl}`,
        '--env', `TARGET_KIND=${process.env.TARGET_KIND || 'fixture'}`,
        '--env', 'LOG_LEVEL=ERROR',
        ...k6Args,
        script
    ], { stdio: ['inherit', 'pipe', 'pipe'] });

    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
    child.stdout.on('data', (chunk) => {
        output += chunk;
        process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
        output += chunk;
        process.stderr.write(chunk);
    });
});

await new Promise((resolve) => server.close(resolve));
const scriptException = output.includes('hint="script exception"');
process.exit(scriptException ? 1 : exitCode);
