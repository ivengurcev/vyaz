#!/usr/bin/env node
'use strict';

import pc from 'picocolors';
import { svgrPlugin } from 'esbuild-svgr-plugin';
import {sassPlugin} from 'esbuild-sass-plugin';
import { build, context } from 'esbuild';
import parseArgv from '../utils/parseArgv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'node:path';
import loadEnv from '../utils/loadEnv.mjs';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    KEY_WATCH = '--watch', 
    KEY_MINIFY = '--minify',
    KEY_SOURCEMAPS = '--sourcemap',    
    pArgs = parseArgv(process.argv, [KEY_WATCH]),
    {
        OUTDIR,
        LAYOUT_APP,
        STATIC_PATH            
    } = loadEnv(),
    APP_CORE = join(dirname(__dirname), 'Layout/ApplicationCore.jsx'),
    APP_CURRENT_ROUTE = join(dirname(__dirname), 'Layout/CurrentRoute.jsx'),
    isWatch = !!pArgs[KEY_WATCH],
    isMinify = !!pArgs[KEY_MINIFY],
    isSourceMaps = !!pArgs[KEY_SOURCEMAPS],
    config = {
        jsx: 'automatic',
        bundle: true,
        platform: 'browser',
        format: 'esm',
        sourcemap: isSourceMaps,
        logLevel: 'error',
        minify: isMinify,
        entryPoints: {
            index: join(__dirname, 'bootstrap.jsx'),
            routes: resolvePath('./routes.js'),
            SiteApp: resolvePath(LAYOUT_APP),
            AppCore: resolvePath(APP_CORE),
            CurrentRoute : resolvePath(APP_CURRENT_ROUTE)            
        },
        outdir: join(resolvePath(OUTDIR), STATIC_PATH), 
        outbase: 'public',
        splitting: true,
        loader: { 
            '.png': 'file',
            '.css': 'file' 
        },
        // publicPath: `${server.rsc}/`,
        plugins: [
            {
                name: 'resolve-farrage-paths',
                setup(build) {
                    build.onStart(() => {
                        console.log(pc.green('------------------------------ Сборка началась -----------------------------------'));
                    });
                    build.onEnd(async () => {
                        console.log(pc.yellow('---- сборка окончена -----'));
                    });                      
                    build.onResolve({ filter: /(AppCore|SiteApp|CurrentRoute|routes)\.js$/}, async ({ 
                        // path, 
                        importer, 
                        // ...props
                    }) => {
                        if(basename(importer) === 'bootstrap.jsx') {
                            return ({
                                // path: resolvePath(path),
                                external: true
                            })
                        }
                    });
                }
            },
            // resolveWorkspace,
            // selfResolve,
            // // cssPlugin, 
            sassPlugin({
                cssImports: true
            }),
            svgrPlugin(),
            // staticImports
        ]        
    };

// build process
async function bundle() {
    await build(config);
}
async function watch() {
    const cxClient = await context(config);
    cxClient.watch();
}
if(isWatch) {
    watch();
} else {
    bundle();
}