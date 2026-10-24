import { verifyAuthRedirect } from './auth.mjs';
export async function attachRouter(app, {routes, hasAccess, ...settings}) {
    routes.forEach(route => {
        if(route.path) {
            const verifyRouteAuth = verifyAuthRedirect(route.isPrivate, settings);

            app.get(route.path, async (c, next) => {
                if(c.get('currentRoute')) {
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

                    const curRouteComponent = await route.component();
                    c.set('initialData', route.getData?.(c));
                    c.set('currentRoute', curRouteComponent.default);
                    c.set('currentRouteTitle', route.title || '');
                    c.set('currentRouteComponentPath', route.componentPath || null);
                    await next();
                });
            });
        }
    });
    // app.get('/*', checkRoutes());
}
