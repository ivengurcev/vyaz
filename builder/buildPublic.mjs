import pc from 'picocolors';
import {sassPlugin} from 'esbuild-sass-plugin';
import { build, context } from 'esbuild';
import resolvePath from './utils/resolvePath.mjs';
import { dirname, join, basename } from 'node:path';
import svgrPlugin from './svgrPlugin.mjs';
import getConfigPlugin from './configPlugin.mjs';
import cssModulesPlugin from './cssModulesPlugin.mjs';
import { fileURLToPath } from 'url';
import getRouterPlugin from './routerPlugin.mjs';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);

export default async function buildPublic({routes, ...settings}) {
    const {
        OUTDIR,
        PUBLIC_PATH,
        LAYOUT_APP,
        LAYOUT_AUTH,
        isWatch,
        isMinify,
        isSourceMaps        
    } = settings,
    APP_CORE = join(__dirname, '../Layout/ApplicationCore.jsx'),
    APP_CURRENT_ROUTE = join(__dirname, '../Layout/CurrentRoute.jsx'),
    indexPath = join(__dirname, '__bootstrap.js'),
    
    config = {
        jsx: 'automatic',
        bundle: true,
        platform: 'browser',
        format: 'esm',
        sourcemap: isSourceMaps,
        logLevel: 'error',
        minify: isMinify,
        entryPoints: {
            index: indexPath,
            SiteApp: resolvePath(LAYOUT_APP),
            AppCore: resolvePath(APP_CORE),
            CurrentRoute : resolvePath(APP_CURRENT_ROUTE),
            ...(LAYOUT_AUTH ? {
                Auth: resolvePath(LAYOUT_AUTH),
                index_auth: join(__dirname, '__bootstrap_auth.js'),
            } : {})         
        },
        outdir: join(resolvePath(OUTDIR), PUBLIC_PATH), 
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
            getRouterPlugin({routes, ...settings}),
            getConfigPlugin(settings),
            // resolveWorkspace,
            // selfResolve,
            // // cssPlugin, 
            // Handle SCSS/CSS modules first
            cssModulesPlugin(settings),
            // Handle SCSS/CSS         
            sassPlugin({
                filter: /\.(s[ac]ss|css)$/,
                // type: 'style', // Injects styles into the bundle as a <style> tag or CSS file
            }),
            svgrPlugin(settings),
            // staticImports
        ]        
    };
    if(isWatch) {
        const cxClient = await context(config);
        cxClient.watch();
    } else {
        await build(config);
    }
}