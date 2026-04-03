import { authHandler, initAuthConfig, verifyAuth, getAuthUser } from '@hono/auth-js';
import { join } from 'node:path';
import CredentialsProvider from '@auth/core/providers/credentials';

// import { except } from 'hono/combine';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import {renderToPipeableStream} from 'react-dom/server';

// import picocolors from 'picocolors';
import resolvePath from '../builder/utils/resolvePath.mjs';


export function verifyAuthRedirect(isSecure, {AUTH_SIGNIN}) {
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
export async function attachAuth(app, {
    auth,
    AUTH_URL,
    AUTH_SIGNIN,
    LAYOUT_AUTH, 
    PUBLIC_PATH,
    OUTDIR, 
    PAGE_TITLE
}) {
    process.loadEnvFile();
    const SSR_DIR = join(resolvePath(OUTDIR), 'ssr');
    // process.env.AUTH_SECRET = AUTH_SECRET;
    process.env.AUTH_TRUST_HOST = 'true';
    // process.env.AUTH_URL = authEnvUrl;
    app.use(
        '*', // Apply Auth.js to routes under /api/auth
        initAuthConfig(c => auth({
            c,
            SSR_DIR,
            AUTH_URL,
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
