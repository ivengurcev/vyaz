import { verifyAuthRedirect } from './auth.mjs';
import createRouter from '../router/createRouter.js';

export async function attachRouter(app, {routes, hasAccess, ...settings}) {
    const router = createRouter(routes);

    app.get('*', async (c, next) => {
        if(c.get('currentRouteMatched')) {
            return next();
        }

        const route = router.resolve(new URL(c.req.url));
        if (!route) {
            return next();
        }

        const verifyRouteAuth = verifyAuthRedirect(route.isPrivate, settings);
        return verifyRouteAuth(c, async () => {
            const {session} = c.get('authUser') || {},
                user = session?.user,
                accessGranted = hasAccess
                    ? await hasAccess(user, route, c)
                    : true;
            if (!accessGranted) {
                return c.text('Недостаточно прав для доступа к странице', 403);
            }

            const curRouteComponent = route.disableSSR ? null : await route.component();
            if (!route.disableSSR) {
                c.set('initialData', route.getData?.(c));
                c.set('currentRoute', curRouteComponent.default);
            }
            c.set('currentRouteMatched', true);
            c.set('disableSSR', !!route.disableSSR);
            c.set('currentRouteTitle', route.title || '');
            c.set('currentRouteComponentPath', route.componentPath || null);
            await next();
        });
    });
}
