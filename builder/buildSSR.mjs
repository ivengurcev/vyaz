
import { build } from 'esbuild';
import {dirname, join} from 'node:path';
import { fileURLToPath } from 'url';
import resolvePath from './utils/resolvePath.mjs';
// import { createRequire } from 'node:module';
// import reactPlugin from './reactPlugin.mjs';
import svgrPlugin from './svgrPlugin.mjs';
import getConfigPlugin from './configPlugin.mjs';
import cssModulesPlugin from './cssModulesPlugin.mjs';
import getRoutesPlugin from './routesPlugin.mjs';
import workspaceCorePlugin from './workspaceCorePlugin.mjs';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);


export default function buildSSR({
    routes, 
    ...settings
}) {
    const {
            OUTDIR,
            LAYOUT_HTML,
            LAYOUT_APP,
        } = settings,
        APP_CORE = join(dirname(__dirname), 'Layout/ApplicationCore.jsx'),
        APP_CURRENT_ROUTE = join(dirname(__dirname), 'Layout/ServerCurrentRoute.jsx');
    return build({
        jsx: 'automatic',
        entryPoints: {
            routes: '__routes__',
            Layout: resolvePath(LAYOUT_HTML),
            SiteApp: resolvePath(LAYOUT_APP),
            AppCore: resolvePath(APP_CORE),
            CurrentRoute : resolvePath(APP_CURRENT_ROUTE),
        }, 
        bundle: true,
        platform: 'node',
        format: 'esm',
        external: [
            'react',
            'react/jsx-runtime',
            'react-dom',
            'react-dom/server',
        ],
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
            // reactPlugin(),
            workspaceCorePlugin(),
            getConfigPlugin(settings),
            getRoutesPlugin({routes, ...settings}),
            svgrPlugin(),
            cssModulesPlugin(),
        ]
    });
}
