import { appendFile } from 'node:fs/promises';
import { HEAVY_PROFILES } from '../../src/config/profileCatalog.js';

const [requested, ...flags] = process.argv.slice(2);

try {
    const profiles = requested === 'all'
        ? [...HEAVY_PROFILES]
        : HEAVY_PROFILES.includes(requested) ? [requested] : null;
    if (!profiles) throw new Error(`Unsupported heavy profile: ${requested || '<missing>'}`);

    if (flags.includes('--dry-run')) {
        process.stdout.write(`${JSON.stringify({ profiles })}\n`);
    } else {
        if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
        await appendFile(process.env.GITHUB_OUTPUT, `profiles=${JSON.stringify(profiles)}\n`);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 2;
}
