import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function argument(name) {
    const index = process.argv.indexOf(name);
    return index === -1 ? null : process.argv[index + 1];
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function reportLink(name) {
    const href = encodeURIComponent(name).replace(/'/g, '%27');
    return `<li><a href="${href}">${escapeHtml(name)}</a></li>`;
}

async function findHtmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await findHtmlFiles(entryPath));
        else if (entry.isFile() && entry.name.endsWith('.html')) files.push(entryPath);
    }
    return files;
}

try {
    const source = argument('--source');
    const destination = argument('--destination');
    const runNumber = argument('--run-number');
    if (!source || !destination || !/^\d+$/.test(runNumber || '')) {
        throw new Error('Usage: publish-reports --source <dir> --destination <dir> --run-number <number>');
    }

    const reports = await findHtmlFiles(path.resolve(source));
    if (reports.length === 0) throw new Error('No successful HTML reports available');

    const runDirectoryName = `run-${runNumber}`;
    const runDirectory = path.resolve(destination, runDirectoryName);
    const reportNames = reports.map((report) => path.basename(report)).sort();
    if (process.argv.includes('--dry-run')) {
        process.stdout.write(`${JSON.stringify({ runDirectory: runDirectoryName, reports: reportNames })}\n`);
    } else {
        await mkdir(runDirectory, { recursive: true });
        for (const report of reports) await copyFile(report, path.join(runDirectory, path.basename(report)));

        const links = reportNames.map(reportLink).join('');
        await writeFile(
            path.join(runDirectory, 'index.html'),
            `<!doctype html><html><head><meta charset="utf-8"><title>K6 reports</title></head><body><h1>K6 reports — run #${runNumber}</h1><ul>${links}</ul></body></html>`
        );
        await writeFile(
            path.resolve(destination, 'index.html'),
            `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${runDirectoryName}/"></head></html>`
        );
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 2;
}
