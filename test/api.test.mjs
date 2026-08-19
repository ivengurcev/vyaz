import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { attachAPI } from '../server/api.mjs';

test('API keeps JSON responses and passes explicit Response objects through', async () => {
    const app = new Hono();

    await attachAPI(app, {
        API_ROOT: '/api',
        api: [
            ['/metadata', {}, async () => ({ title: 'archive' })],
            ['/download', {}, async () => new Response('original bytes', {
                headers: { 'Content-Type': 'application/octet-stream' },
                status: 206,
            })],
        ],
    });

    const metadata = await app.request('/api/metadata'),
        download = await app.request('/api/download');

    assert.deepEqual(await metadata.json(), { title: 'archive' });
    assert.equal(download.status, 206);
    assert.equal(download.headers.get('Content-Type'), 'application/octet-stream');
    assert.equal(await download.text(), 'original bytes');
});
