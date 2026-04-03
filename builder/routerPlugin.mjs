import getStringRoute from './utils/getStringRoute.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    WORKSPACE_CONFIG = '@@router@@',
    ROUTER_FILTER = /^__router__$/;

export default function getRouterPlugin({
    routes,
    // ...settings
}) {
    return {
        name: 'router-plugin',
        setup(build) {
            build.onResolve({ filter: ROUTER_FILTER }, async ({path}) => {
                return {
                    path,
                    namespace: WORKSPACE_CONFIG
                }
            });
            build.onLoad({ filter: /.*$/, namespace: WORKSPACE_CONFIG }, async () => {
                    const contents = 'import createRouter from \'../router/createRouter\';\n' 
                    + `export default createRouter(${getStringRoute(routes)});`;
                return {
                    resolveDir: __dirname,
                    loader: 'js',
                    contents
                }
            })
        }
    };
} 
