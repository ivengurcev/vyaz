import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import getResult from 'reneco-utils/getResult.js';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createElement } from 'react';
import { serveStatic } from '@hono/node-server/serve-static';
import {renderToPipeableStream} from 'react-dom/server';
import { join } from 'node:path';
import buildSSR from './builder/buildSSR.mjs';
import resolvePath from './builder/utils/resolvePath.mjs';
import normalizeRouteComponent from './Layout/normalizeRouteComponent.js';
import getServerCallbacks from './utils/getServerCallbacks.mjs';

import loadEnv from './utils/loadEnv.mjs';
import { attachRouter } from './server/router.mjs';
import { attachAPI } from './server/api.mjs';
import { attachAuth } from './server/auth.mjs';
import pc from 'picocolors';
import { resolve, dirname } from 'node:path';
import parseArgv from 'reneco-utils/parseArgv.js';
import buildPublic from './builder/buildPublic.mjs';
import normalizeSettings from './utils/normalizeSettings.mjs';
import { access } from 'node:fs/promises';

const KEY_BUILD_SSR = '--build-ssr',
    KEY_BUILD_PUBLIC = '--build-public',
    KEY_WATCH = '--watch', 
    KEY_MINIFY = '--minify',
    KEY_SOURCEMAPS = '--sourcemap',   
    pArgs = parseArgv(process.argv, [KEY_WATCH, KEY_MINIFY, KEY_SOURCEMAPS, KEY_BUILD_SSR, KEY_BUILD_PUBLIC]),
    isBuildSSR = !!pArgs[KEY_BUILD_SSR],
    isBuildPublic = !!pArgs[KEY_BUILD_PUBLIC],
    isWatch = !!pArgs[KEY_WATCH],
    isMinify = !!pArgs[KEY_MINIFY],
    isSourceMaps = !!pArgs[KEY_SOURCEMAPS],
    workspace = process.cwd();


export default async function farrage({
    routes,
    auth,
    api,
    hasAccess,
    ...settings
}) {
    const normalizedSettings = normalizeSettings({
            ...settings,
            isWatch,
            isMinify,
            isSourceMaps
        }),
        {
            PORT, 
            OUTDIR, 
            ASSET_PUBLIC_BASE,
            STATIC_PATH,
            PUBLIC_PATH,
            PAGE_TITLE
        } = normalizedSettings,
        SSR_DIR = join(resolvePath(OUTDIR), 'ssr'),
        LAYOUT_SSR_PATH = join(SSR_DIR, 'Layout.js'),
        APP_CORE_SSR_PATH = join(SSR_DIR, 'AppCore.js'),
        SITE_APP_SSR_PATH = join(SSR_DIR, 'SiteApp.js'),
        CURRENT_ROUTE_SSR_PATH = join(SSR_DIR, 'CurrentRoute.js'),
        ROUTES_SSR_PATH = join(SSR_DIR, 'routes.js');
    // console.log(normalizedSettings)
    if(isBuildPublic) {
        
        return await buildPublic({routes, auth, api, ...normalizedSettings});
    }
    if(isBuildSSR) {
        await buildSSR({routes, auth, api, ...normalizedSettings});
    }
    
    const app = new Hono();
    /** 
     *  статика
     */
    app.use(`${STATIC_PATH}/*`, serveStatic({
        root: `${workspace}`     
    }));
    app.use(`${ASSET_PUBLIC_BASE}/*`, serveStatic({
        root: `${workspace}`
    }));
    app.use(`${PUBLIC_PATH}/*`, serveStatic({ 
        root: resolvePath(OUTDIR),  
    }));
    if(auth) {
        await attachAuth(app, {...normalizedSettings, auth, hasAccess});
    }
    if(api) {
        await attachAPI(app, {...normalizedSettings, api, hasAccess});
    }

    try {
        await access(LAYOUT_SSR_PATH);
        await access(APP_CORE_SSR_PATH);
        await access(SITE_APP_SSR_PATH);
        await access(CURRENT_ROUTE_SSR_PATH);
    } catch (e) {
        console.error(e);
        console.log(pc.red(`Не удалось запустить. Не найдены файлы ssr`));
        process.exit(1);
    }

    if(routes) {
        await attachRouter(app, {
            ...normalizedSettings,
            hasAccess,
            routes: (await import(ROUTES_SSR_PATH)).default
        });
    }
    /**
     * Главный маршрут
     */
    app.get('/*', async (c) => {
        const [Layout, AppCore, App, CurrentRoute] = await Promise.all([
                import(LAYOUT_SSR_PATH),
                import(APP_CORE_SSR_PATH),
                import(SITE_APP_SSR_PATH),
                import(CURRENT_ROUTE_SSR_PATH),
            ]),
            cTitle = c.get('currentRouteTitle'),
            ContentComponent = c.get('currentRoute'),
            // authData = c.get('authUser'),
            // rawAuthUser = authData?.session?.user || authData?.user || null,
            location = new URL(c.req.url),
            // { getAuthUserData, getInitialData } = await getServerCallbacks(),
            // authUser = typeof getAuthUserData === 'function'
            //     ? await getAuthUserData({
            //         c,
            //         authUser: rawAuthUser,
            //         location,
            //     })
            //     : rawAuthUser,
            routeInitialData = c.get('initialData'),
            initialData = {
                // authUser,
                ...(routeInitialData || {}),
            },
            content = createElement(AppCore.default, { // AppCore
                path: location, 
                component: ContentComponent,
                // authUser,
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
}