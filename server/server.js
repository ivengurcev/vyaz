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

import loadEnv from '../utils/loadEnv.mjs';
import { attachRouter } from './router.mjs';

await buildSSR();

const workspace = process.cwd(),
    env = loadEnv(),
    // serverConfig = await getServerConfig(),
    app = new Hono(),
    // { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app }),
    {
        PORT, 
        OUTDIR, 
        STATIC_PATH,
        PAGE_TITLE
    } = env,
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr'),
    PUBLIC_PATH = STATIC_PATH;

/** 
 *  статика
 */
app.use(`/static/*`, serveStatic({
    root: `${workspace}`     
}));
app.use(`${STATIC_PATH}/*`, serveStatic({ 
    root: resolvePath(OUTDIR),  
}));

/**
 * Подключаем разные маршруты
 */



attachRouter(app);

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
        ContentComponent = c.get('currentRoute'),
        location = new URL(c.req.url),
        apiData = {
            // [serverConfig.api + location.pathname + location.search]: await resolveAPI(serverConfig.api + location.pathname + location.search, c)
        },
        stream = renderToPipeableStream(createElement(Layout.default, {
            title: cTitle ? getResult(cTitle, PAGE_TITLE) : PAGE_TITLE,
            scripts: [join(PUBLIC_PATH, 'index.js')],
            styles: [
                join(PUBLIC_PATH, 'routes.css'),
                join(PUBLIC_PATH, 'SiteApp.css')
            ],
            apiData
        }, createElement(AppCore.default, {
            path: location, 
            // content: ContentComponent && createElement(ContentComponent),
            apiData
        }, createElement(App.default, {
            path: location
        }, createElement(CurrentRoute.default, {
            path: location, 
            component: ContentComponent
        })))), '');
    // console.log('---CUUUUU', CurrentRoute.default);
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
