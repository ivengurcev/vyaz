#!/usr/bin/env node
'use strict';

// import pc from 'picocolors';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import getResult from 'reneco-utils/getResult.js';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import {renderToPipeableStream} from 'react-dom/server';
import { join } from 'node:path';
import buildSSR from '../builder/buildSSR.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import normalizeRouteComponent from '../Layout/normalizeRouteComponent.js';
import getServerCallbacks from '../utils/getServerCallbacks.mjs';

import loadEnv from '../utils/loadEnv.mjs';
import { attachRouter } from './router.mjs';
import { attachAPI } from './api.mjs';
import { attachAuth } from './auth.mjs';

await buildSSR();

const workspace = process.cwd(),
    env = loadEnv(),
    // serverConfig = await getServerConfig(),
    app = new Hono(),
    // { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app }),
    {
        PORT, 
        OUTDIR, 
        ASSET_PUBLIC_BASE,
        STATIC_PATH,
        PAGE_TITLE
    } = env,
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr'),
    PUBLIC_PATH = STATIC_PATH,
    ASSET_PUBLIC_BASE_PATH = `/${String(ASSET_PUBLIC_BASE || '/uploads').replace(/^\/+|\/+$/g, '')}`;

/** 
 *  статика
 */
app.use(`/static/*`, serveStatic({
    root: `${workspace}`     
}));
app.use(`${ASSET_PUBLIC_BASE_PATH}/*`, serveStatic({
    root: `${workspace}`
}));
app.use(`${STATIC_PATH}/*`, serveStatic({ 
    root: resolvePath(OUTDIR),  
}));

/**
 * 
 */
await attachAuth(app);

/**
 * API
 */
await attachAPI(app);

/**
 * Подключаем разные маршруты
 */
await attachRouter(app);

/**
 * Главный маршрут
 */
app.get('/*', async (c) => {
    const [Layout, AppCore, App, CurrentRoute] = await Promise.all([
            import(join(SSR_DIR, 'Layout.js')),
            import(join(SSR_DIR, 'AppCore.js')),
            import(join(SSR_DIR, 'SiteApp.js')),
            import(join(SSR_DIR, 'CurrentRoute.js'))
        ]),
        cTitle = c.get('currentRouteTitle'),
        ContentComponent = normalizeRouteComponent(c.get('currentRoute')),
        authData = c.get('authUser'),
        rawAuthUser = authData?.session?.user || authData?.user || null,
        location = new URL(c.req.url),
        { getAuthUserData, getInitialData } = await getServerCallbacks(),
        authUser = typeof getAuthUserData === 'function'
            ? await getAuthUserData({
                c,
                authUser: rawAuthUser,
                location,
            })
            : rawAuthUser,
        routeInitialData = typeof getInitialData === 'function'
            ? await getInitialData({
                c,
                authUser,
                location,
            })
            : {},
        initialData = {
            authUser,
            ...(routeInitialData || {}),
        },
        content = createElement(AppCore.default, { // AppCore
            path: location, 
            component: ContentComponent,
            authUser,
            initialData,
        }, createElement(App.default, {
            path: location
        }, createElement(CurrentRoute.default, {
            path: location, 
            component: ContentComponent
        }))),
        stream = renderToPipeableStream(createElement(Layout.default, { // Layout(HTML)
            title: cTitle ? getResult(cTitle, PAGE_TITLE) : PAGE_TITLE,
            scripts: [join(PUBLIC_PATH, 'index.js')],
            styles: [
                join(PUBLIC_PATH, 'routes.css'),
                join(PUBLIC_PATH, 'SiteApp.css')
            ],
            apiData: initialData
        }, content), '');
    stream.pipe(c.env.outgoing);
    return RESPONSE_ALREADY_SENT;
});

serve({
    fetch: app.fetch,
    port: PORT,
}, (info) => {
    // await build();
    console.log(`Listening on http://localhost:${info.port}`);
});
