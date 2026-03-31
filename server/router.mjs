import { join } from 'node:path';
import loadEnv from '../utils/loadEnv.mjs';
import resolvePath from '../utils/resolvePath.mjs';
import createRouter from '../router/createRouter.js';
import { access } from 'node:fs/promises';
import picocolors from 'picocolors';

import { verifyAuthRedirect } from './auth.mjs';
import getAuthCallbacks from '../utils/getAuthCallbacks.mjs';

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


export async function attachRouter(app) {
    const routes = await getRoutes(),
        {hasAccess} = await getAuthCallbacks();
    router.current = createRouter(routes);
    // console.log(routes);
    routes.forEach(route => {
        if(route.path) {
            app.get(
                route.path, 
                verifyAuthRedirect(route.isPrivate),
                (c, next) => {
                    if(route.isPrivate) {
                        const authUser = c.get('authUser');
                        if (route.permissions?.length > 0 && !hasAccess?.(authUser, route)) {
                            console.log('NO ACCESS', route.path);
                            return c.text('Недостаточно прав для доступа к странице', 403);
                        }
                    }
                    return next();
                },
                async (c, next) => {
                    const curRouteComponent = await route.component();
                    console.log('curRouteComponent', curRouteComponent);
                    c.set('currentRoute', curRouteComponent.default);
                    c.set('currentRouteTitle', route.title || '');
                    await next();    
                }
            );
        }
    });
    // app.get('/*', checkRoutes());
}
