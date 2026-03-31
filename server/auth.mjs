import { authHandler, initAuthConfig, verifyAuth, getAuthUser } from '@hono/auth-js';
import { join } from 'node:path';
import CredentialsProvider from '@auth/core/providers/credentials';

// import { except } from 'hono/combine';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import {renderToPipeableStream} from 'react-dom/server';

// import picocolors from 'picocolors';
import loadEnv from '../utils/loadEnv.mjs';
import { SIGNIN } from '../getAuthUrl.js';
import resolvePath from '../utils/resolvePath.mjs';
import getAuthCallbacks from '../utils/getAuthCallbacks.mjs';

const env = loadEnv(),
    { 
        AUTH_SECRET, 
        AUTH_URL,
        AUTH_SIGNIN,
        OUTDIR,
        PAGE_TITLE,
        STATIC_PATH,
        LAYOUT_AUTH,
        // API_ROOT
    } = env,
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr');

process.env.AUTH_SECRET = AUTH_SECRET;
process.env.AUTH_TRUST_HOST = 'true';

export function verifyAuthRedirect(isSecure) {
    return async (c, next) => {
        const authUser = await getAuthUser(c),
            isAuth = !!authUser?.token || !!authUser?.user;
        if (isSecure && !isAuth) {
            const loginUrl = `${AUTH_SIGNIN}?${new URLSearchParams({callbackUrl: c.req.url})}`;
            return c.redirect(loginUrl, 302);
        }
        c.set('authUser', authUser);
        await next();
    };    
}

export {verifyAuth};
export async function attachAuth(app) {
    const {init} = await getAuthCallbacks();
    app.use(
        '*', // Apply Auth.js to routes under /api/auth
        initAuthConfig((/*c*/) => init({
            ...env, 
            SSR_DIR,
            CredentialsProvider
        }))
    );
    if(LAYOUT_AUTH.length > 0) {
        app.get(`${AUTH_URL}${SIGNIN}`, async (c) => {
            const [Layout] = await Promise.all([
                    import(join(SSR_DIR, 'Layout.js')),
                    // import(join(SSR_DIR, 'AppCore.js')),
                    // import(join(SSR_DIR, 'Auth.js'))
                ]), 
                stream = renderToPipeableStream(createElement(Layout.default, {
                    title: `${PAGE_TITLE}: Авторизация`,
                    scripts: [join(STATIC_PATH, 'index_auth.js')],
                    styles: [
                        join(STATIC_PATH, 'SiteApp.css'), 
                        join(STATIC_PATH, 'Auth.css')
                    ],                
                }), '');
            stream.pipe(c.env.outgoing);
            return RESPONSE_ALREADY_SENT;
        });    
    }
    app.use(`${AUTH_URL}/*`, authHandler());
}
