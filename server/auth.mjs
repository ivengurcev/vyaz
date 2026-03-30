import { authHandler, initAuthConfig, verifyAuth, getAuthUser } from '@hono/auth-js';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import CredentialsProvider from '@auth/core/providers/credentials';

// import { except } from 'hono/combine';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import {renderToPipeableStream} from 'react-dom/server';

import picocolors from 'picocolors';
import loadEnv from '../utils/loadEnv.mjs';
import { SIGNIN } from '../getAuthUrl.js';
import resolvePath from '../utils/resolvePath.mjs';

const { 
        AUTH_SECRET, 
        AUTH_URL,
        OUTDIR,
        PAGE_TITLE,
        STATIC_PATH,
        LAYOUT_AUTH,
        SERVER_URL,
        // API_ROOT
    } = loadEnv(),
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr');

process.env.AUTH_SECRET = AUTH_SECRET;
process.env.AUTH_URL = `${SERVER_URL}${AUTH_URL}`;


async function getAuthCallbacks() {
    const workspace = process.cwd(),
        apiPath = join(workspace, 'auth.mjs');
    try {
        await access(apiPath);
        const apiRoutes = await import(apiPath);
        return apiRoutes;
    } catch (e) {
        console.error(e);
        console.log(picocolors.red(`Не удалось загрузить файл ${apiPath}`));
        return {};
    }   
}

export function verifyAuthRedirect() {
    return async (c, next) => {
        const authUser = await getAuthUser(c),
            isAuth = !!authUser?.token || !!authUser?.user;
        if (!isAuth) {
            const loginUrl = `${c.get('authConfig').basePath}/signin?${new URLSearchParams({ callbackUrl: c.req.url })}`;
            return c.redirect(loginUrl, 302);
        }
        c.set('authUser', authUser);
        await next();
    };    
}

export {verifyAuth};
export async function attachAuth(app) {
    const {registerAccount, loginAccount} = await getAuthCallbacks();
    app.use(
        '*', // Apply Auth.js to routes under /api/auth
        initAuthConfig((/*c*/) => {
            // console.log('AUTH', AUTH_SECRET, c.env.AUTH_SECRET, c.env.AUTH_URL);
            return ({
            secret: AUTH_SECRET, // Secure secret for signing tokens
            pages: {
                signIn: `${AUTH_URL}${SIGNIN}`
            },
            credentials: {
                login: { label: 'Login', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            callbacks: {
                async jwt({ token, user }) {
                    if (user) {
                        token.id = user.id
                    }
                    return token
                },                
                async session({ session, token }) {
                    if (!session.user) {
                        session.user = {}
                    }
                    // console.log('AUTH CALLBACK', session, token);
                    session.user.id = token?.id
                    return session
                },
            },            
            providers: [
                CredentialsProvider({
                    id: 'signin',
                    name: 'Signin',
                    authorize: loginAccount,
                }),
                CredentialsProvider({
                    id: 'signup',
                    name: 'Signup',
                    authorize: registerAccount,                    
                })
                // Add other providers like Google, GitHub, etc., if needed
            ],
        })})
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
                    styles: [join(STATIC_PATH, 'Auth.css')],                
                }), '');
            stream.pipe(c.env.outgoing);
            return RESPONSE_ALREADY_SENT;
        });    
    }
    app.use(`${AUTH_URL}/*`, authHandler());
}