import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import getExistingStyles from '../utils/getExistingStyles.mjs';

test('includes only CSS files present in the public build', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'vyaz-styles-')),
        publicDir = join(outdir, 'public');
    await mkdir(publicDir);

    try {
        await writeFile(join(publicDir, 'index.css'), '');
        assert.deepEqual(await getExistingStyles({OUTDIR: outdir, PUBLIC_PATH: '/public'}), ['/public/index.css']);

        await writeFile(join(publicDir, 'SiteApp.css'), '');
        assert.deepEqual(await getExistingStyles({OUTDIR: outdir, PUBLIC_PATH: '/public'}), [
            '/public/index.css',
            '/public/SiteApp.css',
        ]);
    } finally {
        await rm(outdir, { recursive: true, force: true });
    }
});

test('returns no stylesheet links when the build emitted no CSS', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'vyaz-styles-'));

    try {
        assert.deepEqual(await getExistingStyles({OUTDIR: outdir, PUBLIC_PATH: '/public'}), []);
    } finally {
        await rm(outdir, { recursive: true, force: true });
    }
});

test('checks a caller-provided stylesheet list for the auth page', async () => {
    const outdir = await mkdtemp(join(tmpdir(), 'vyaz-styles-')),
        publicDir = join(outdir, 'public');
    await mkdir(publicDir);

    try {
        await writeFile(join(publicDir, 'Auth.css'), '');
        assert.deepEqual(await getExistingStyles(
            {OUTDIR: outdir, PUBLIC_PATH: '/public'},
            ['SiteApp.css', 'Auth.css'],
        ), ['/public/Auth.css']);
    } finally {
        await rm(outdir, { recursive: true, force: true });
    }
});
