import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { verifyAuth } from '@hono/auth-js';
import loadEnv from '../utils/loadEnv.mjs';
import picocolors from 'picocolors';

const { API_ROOT } = loadEnv();

async function getAPIRoutes() {
    const workspace = process.cwd(),
        apiPath = join(workspace, 'api.mjs');
    try {
        await access(apiPath);
        const apiRoutes = await import(apiPath);
        return apiRoutes.default;
    } catch (e) {
        console.error(e);
        console.log(picocolors.red(`Не удалось загрузить файл ${apiPath}`));
        return {};
    }   
}
function jsonHandler(handler) {
    return async (c) => c.json(await handler(c));
}

export const METHOD_POST = 'POST',
    METHOD_GET = 'GET',
    METHOD_PUT = 'PUT',
    METHOD_DELETE = 'DELETE';

export async function attachAPI(app) {
    const api = new Hono(),
        apiRoutes = await getAPIRoutes();
    apiRoutes?.forEach(([route, opts, handler]) => {
        const isPrivate = opts?.private,
            method = opts?.method || METHOD_GET,
            wrappedHandler = jsonHandler(handler);
        if (isPrivate) {
            api.use(route, verifyAuth());
        }
        switch (method) {
            case METHOD_POST:
                api.post(route, wrappedHandler);
                break;
            case METHOD_PUT:
                api.put(route, wrappedHandler);
                break;
            case METHOD_DELETE:
                api.delete(route, wrappedHandler);
                break;
            default:
                api.get(route, wrappedHandler);
                break;
        }
    });
    app.route(`${API_ROOT}/`, api);
}