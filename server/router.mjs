import { join } from 'node:path';
import loadEnv from '../utils/loadEnv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import createRouter from '../router/createRouter.js';
const { OUTDIR } = loadEnv(),
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr'),
    routes = await import(join(SSR_DIR, 'routes.js')),
    router = createRouter(routes.default);

export function resolveRoute(route) {
    return router.resolve(route);
}

function checkRoutes() {
    return async (c, next) => {
        const curRoute = router.resolve(new URL(c.req.url));
        if(!curRoute) {
            return c.notFound();
        }
        const curRouteComponent = await curRoute.component();
        // console.log(c.req.url, curRouteComponent, curRouteComponent.default);
        c.set('currentRoute', curRouteComponent.default);
        c.set('currentRouteTitle', curRoute.title || '');
        await next();
    }
}


export function attachRouter(app) {
    app.get('/*', checkRoutes());
}