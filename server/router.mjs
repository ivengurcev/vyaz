import { verifyAuthRedirect } from './auth.mjs';

export async function attachRouter(app, {routes, hasAccess, ...settings}) {
    routes.forEach(route => {
        if (!route.path) {
            return;
        }

        const verifyRouteAuth = verifyAuthRedirect(route.isPrivate, settings);

        app.get(route.path, async (c, next) => {
            if(c.get('currentRouteMatched')) {
                return next();
            }

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
    });
}
