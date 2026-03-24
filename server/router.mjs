import { join } from 'node:path';
import loadEnv from '../utils/loadEnv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import createRouter from '../router/createRouter.js';
import { access } from 'node:fs/promises';
import picocolors from 'picocolors';
const { OUTDIR } = loadEnv(),
    SSR_DIR = join(resolvePath(OUTDIR), 'ssr'),
    router = {}; // createRouter(routes.default);

export function resolveRoute(route) {
    return router?.current.resolve(route);
}

async function getRoutes() {
    const routesPath = join(SSR_DIR, 'routes.js');
    try {
        await access(routesPath);
        return (await import(routesPath)).default;
    } catch (e) {
        console.error(e);
        console.log(picocolors.red(`Не удалось загрузить файл ${routesPath}`));
        return {};
    }   
}

function checkRoutes() {
    return async (c, next) => {
        const curRoute = router?.current.resolve(new URL(c.req.url));
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


export async function attachRouter(app) {
    router.current = createRouter(await getRoutes());
    app.get('/*', checkRoutes());
}