
import { build } from 'esbuild';
import {dirname, join} from 'node:path';
import { fileURLToPath } from 'url';
import loadEnv from '../utils/loadEnv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
// import { createRequire } from 'node:module';
import reactPlugin from './reactPlugin.mjs';
import svgrPlugin from './svgrPlugin.mjs';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);


export default function buildSSR() {
    const {
            OUTDIR,
            LAYOUT_HTML,
            LAYOUT_APP,
            LAYOUT_AUTH            
        } = loadEnv(),
        APP_CORE = join(dirname(__dirname), 'Layout/ApplicationCore.jsx'),
        APP_CURRENT_ROUTE = join(dirname(__dirname), 'Layout/ServerCurrentRoute.jsx');
    return build({
        jsx: 'automatic',
        entryPoints: {
            routes: resolvePath('./routes.js'),
            Layout: resolvePath(LAYOUT_HTML),
            SiteApp: resolvePath(LAYOUT_APP),
            AppCore: resolvePath(APP_CORE),
            CurrentRoute : resolvePath(APP_CURRENT_ROUTE),
            ...(LAYOUT_AUTH 
                ? { Auth: resolvePath(LAYOUT_AUTH)} 
                : {}
            )
        },
        // alias: {
        //     'react': require.resolve('react'),
        //     'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        //     // 'react-dnd': require.resolve('react-dnd')
        // },        
        bundle: true,
        platform: 'node',
        format: 'esm',
        outdir: join(resolvePath(OUTDIR), 'ssr'),
        sourcemap: false,
        splitting: true,
        loader: {
            '.js': 'jsx',
            '.json': 'json',
            '.png': 'empty',
            '.svg': 'empty',
            '.css': 'empty',
            '.scss': 'empty'            
        },
        plugins: [
            reactPlugin(),
            svgrPlugin()
        ]
    });
}
