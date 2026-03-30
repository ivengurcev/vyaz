#!/usr/bin/env node
'use strict';

import pc from 'picocolors';
import {sassPlugin} from 'esbuild-sass-plugin';
import { build, context } from 'esbuild';
import parseArgv from '../utils/parseArgv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'node:path';
import loadEnv from '../utils/loadEnv.mjs';
import svgrPlugin from './svgrPlugin.mjs';
import getConfigPlugin from './configPlugin.mjs';
import cssModulesPlugin from './cssModulesPlugin.mjs';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    KEY_WATCH = '--watch', 
    KEY_MINIFY = '--minify',
    KEY_SOURCEMAPS = '--sourcemap',   
    pArgs = parseArgv(process.argv, [KEY_WATCH]),
    {
        OUTDIR,    
        STATIC_PATH,
        LAYOUT_APP,
        LAYOUT_AUTH
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
            index: join(__dirname, '__bootstrap.js'),
            routes: resolvePath('./routes.js'),
            SiteApp: resolvePath(LAYOUT_APP),
            AppCore: resolvePath(APP_CORE),
            CurrentRoute : resolvePath(APP_CURRENT_ROUTE),
            ...(LAYOUT_AUTH ? {
                Auth: resolvePath(LAYOUT_AUTH),
                index_auth: join(__dirname, '__bootstrap_auth.js'),
            } : {})         
        },
        outdir: join(resolvePath(OUTDIR), STATIC_PATH), 
        outbase: 'public',
        splitting: true,
        loader: { 
            '.png': 'file',
            '.svg': 'file',
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
                    build.onResolve({ filter: /(Auth|AppCore|SiteApp|CurrentRoute|routes)\.js$/}, async ({ 
                        // path, 
                        importer, 
                        // ...props
                    }) => {
                        if(['__bootstrap.js', '__bootstrap_auth.js'].includes(basename(importer))) {
                            return ({
                                // path: resolvePath(path),
                                external: true
                            })
                        }
                    });
                }
            },
            getConfigPlugin(),
            // resolveWorkspace,
            // selfResolve,
            // // cssPlugin, 
            // Handle SCSS/CSS modules first
            cssModulesPlugin(),
            // Handle SCSS/CSS         
            sassPlugin({
                filter: /\.(s[ac]ss|css)$/,
                type: 'style', // Injects styles into the bundle as a <style> tag or CSS file
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
