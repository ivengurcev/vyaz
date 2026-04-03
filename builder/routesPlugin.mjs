import getStringRoute from './utils/getStringRoute.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    WORKSPACE_CONFIG = '@@routes@@',
    ROUTER_FILTER = /^__routes__$/;

export default function getRoutesPlugin({
    routes,
    // ...settings
}) {
    return {
        name: 'routes-plugin',
        setup(build) {
            build.onResolve({ filter: ROUTER_FILTER }, async ({path}) => {
                return {
                    path,
                    namespace: WORKSPACE_CONFIG
                }
            });
            build.onLoad({ filter: /.*$/, namespace: WORKSPACE_CONFIG }, async () => {
                    const contents = `export default ${getStringRoute(routes, true)};`;
                // console.log(contents);
                return {
                    resolveDir: __dirname,
                    loader: 'js',
                    contents
                }
            })
        }
    };
} 
