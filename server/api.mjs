import { Hono } from 'hono';
import { getAuthUser, verifyAuth } from '@hono/auth-js';
// import picocolors from 'picocolors';

import {
    DELETE as METHOD_DELETE,
    GET as METHOD_GET,
    PATCH as METHOD_PATCH,
    POST as METHOD_POST,
    PUT as METHOD_PUT
} from './methods.js';


function jsonHandler(handler) {
    return async (c) => {
        const result = await handler(c);

        return result instanceof Response ? result : c.json(result);
    };
}

export async function checkAccess(hasAccess, authUser, requirements, c) {
    return !hasAccess || await hasAccess(authUser, requirements, c);
}

function accessMiddleware(hasAccess, requirements = {}) {
    return async (c, next) => {
        const authUser = await getAuthUser(c);
        if (!(await checkAccess(hasAccess, authUser, requirements, c))) {
            return c.json({ error: 'Доступ запрещён' }, 403);
        }
        c.set('authUser', authUser)
        return await next()
    }
}


export async function attachAPI(app, {api: apiRoutes, API_ROOT, hasAccess}) {
    const api = new Hono();
    apiRoutes?.forEach(([route, opts, handler]) => {
        const isPrivate =
                opts?.private ||
                opts?.permissions?.length > 0 ||
                opts?.permissionsAny?.length > 0 ||
                opts?.roles?.length > 0,
            method = opts?.method || METHOD_GET,
            wrappedHandler = jsonHandler(handler);
        if (isPrivate) {
            api.use(route, verifyAuth(), accessMiddleware(hasAccess, opts || {}));
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
