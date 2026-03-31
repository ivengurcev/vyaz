import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { Hono } from 'hono';
import { getAuthUser, verifyAuth } from '@hono/auth-js';
import loadEnv from '../utils/loadEnv.mjs';
import picocolors from 'picocolors';

import {
    DELETE as METHOD_DELETE,
    GET as METHOD_GET,
    PATCH as METHOD_PATCH,
    POST as METHOD_POST,
    PUT as METHOD_PUT
} from './methods.js';
import getAuthCallbacks from '../utils/getAuthCallbacks.mjs';

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

function accessMiddleware(requirements = {}) {
    return async (c, next) => {
        const authUser = await getAuthUser(c);
        const {hasAccess} = await getAuthCallbacks();

        if (!hasAccess(authUser, requirements)) {
            return c.json({ error: 'Доступ запрещён' }, 403)
        }

        c.set('authUser', authUser)
        await next()
    }
}


export async function attachAPI(app) {
    const api = new Hono(),
        apiRoutes = await getAPIRoutes();
    apiRoutes?.forEach(([route, opts, handler]) => {
        const isPrivate = opts?.private || opts?.permissions?.length > 0 || opts?.roles?.length > 0,
            method = opts?.method || METHOD_GET,
            wrappedHandler = jsonHandler(handler);
        if (isPrivate) {
            api.use(route, verifyAuth(), accessMiddleware(opts || {}));
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
            case METHOD_PATCH:
                api.patch(route, wrappedHandler);
                break;
            default:
                api.get(route, wrappedHandler);
                break;
        }
    });
    app.route(`${API_ROOT}/`, api);
}
