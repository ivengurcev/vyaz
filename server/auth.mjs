import { authHandler, initAuthConfig, verifyAuth, getAuthUser } from '@hono/auth-js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import CredentialsProvider from '@auth/core/providers/credentials';

// import { except } from 'hono/combine';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import {renderToPipeableStream} from 'react-dom/server';

// import picocolors from 'picocolors';
import resolvePath from '../builder/utils/resolvePath.mjs';


/**
 * Создаёт middleware маршрута, получающий текущего пользователя при настроенном Auth.js.
 *
 * Публичные маршруты работают без auth-состояния, если workspace не подключил
 * авторизацию. Приватные маршруты возвращают явную ошибку вместо запуска с
 * отсутствующей конфигурацией.
 *
 * @param {boolean} isSecure
 * @param {object} settings
 * @param {string} settings.AUTH_SIGNIN
 * @param {Function} [settings.auth]
 * @returns {Function}
 */
export function verifyAuthRedirect(isSecure, {AUTH_SIGNIN, auth}) {
    return async (c, next) => {
        if (!auth) {
            if (isSecure) {
                return c.text('Authentication is not configured', 503);
            }

            c.set('authUser', null);
            return await next();
        }

        const authUser = await getAuthUser(c),
            isAuth = !!authUser?.token || !!authUser?.user;
        if (isSecure && !isAuth) {
            const loginUrl = `${AUTH_SIGNIN}?${new URLSearchParams({callbackUrl: c.req.url})}`;
            return c.redirect(loginUrl, 302);
        }
        c.set('authUser', authUser);
        return await next();
    };    
}

export {verifyAuth};
function buildAuthEnvUrl(SERVER_URL, AUTH_URL) {
    const baseUrl = new URL(SERVER_URL),
        authPath = String(AUTH_URL || '/auth').replace(/^\/+/, '');

    return new URL(authPath, `${baseUrl.origin}/`).toString().replace(/\/$/, '');
}

function isAbsoluteUrl(value) {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

function configureAuthEnvUrl(SERVER_URL, AUTH_URL) {
    if (process.env.SERVER_URL) {
        process.env.AUTH_URL = buildAuthEnvUrl(SERVER_URL, AUTH_URL);
        return;
    }

    if (process.env.AUTH_URL && !isAbsoluteUrl(process.env.AUTH_URL)) {
        delete process.env.AUTH_URL;
    }
}

export async function attachAuth(app, {
    auth,
    SERVER_URL,
    AUTH_URL,
    AUTH_SECRET,
    AUTH_SIGNIN,
    LAYOUT_AUTH, 
    PUBLIC_PATH,
    OUTDIR, 
    PAGE_TITLE
}) {
    const envFile = process.env.APP_ENV_FILE || '.env';

    if (process.env.APP_ENV_FILE || existsSync(envFile)) {
        process.loadEnvFile(envFile);
    }

    const SSR_DIR = join(resolvePath(OUTDIR), 'ssr');
    // process.env.AUTH_SECRET = AUTH_SECRET;
    process.env.AUTH_TRUST_HOST = 'true';
    configureAuthEnvUrl(SERVER_URL, AUTH_URL);
    app.use(
        '*', // Apply Auth.js to routes under /api/auth
        initAuthConfig(c => auth({
            c,
            SSR_DIR,
            AUTH_URL,
            AUTH_SECRET,
            AUTH_SIGNIN,
            CredentialsProvider
        }))
    );

    if(LAYOUT_AUTH.length > 0) {
        app.get(AUTH_SIGNIN, async (c) => {
            const [Layout] = await Promise.all([
                    import(join(SSR_DIR, 'Layout.js')),
                ]), 
                stream = renderToPipeableStream(createElement(Layout.default, {
                    title: `${PAGE_TITLE}: Авторизация`,
                    scripts: [join(PUBLIC_PATH, 'index_auth.js')],
                    styles: [
                        join(PUBLIC_PATH, 'SiteApp.css'), 
                        join(PUBLIC_PATH, 'Auth.css')
                    ],                
                }), '');
            stream.pipe(c.env.outgoing);
            return RESPONSE_ALREADY_SENT;
        });    
    }
    app.use(`${AUTH_URL}/*`, authHandler());
}
