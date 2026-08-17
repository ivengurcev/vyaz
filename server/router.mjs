import { verifyAuthRedirect } from './auth.mjs';
export async function attachRouter(app, {routes, hasAccess, ...settings}) {
    routes.forEach(route => {
        if(route.path) {
            app.get(
                route.path, 
                verifyAuthRedirect(route.isPrivate, settings),
                async (c, next) => {
                    const {session} = c.get('authUser') || {},
                        user = session?.user,
                        accessGranted = hasAccess
                            ? await hasAccess(user, route)
                            : true;
                    if (!accessGranted) {
                        return c.text('Недостаточно прав для доступа к странице', 403);
                    }
                    return next();
                },
                async (c, next) => {
                    const curRouteComponent = await route.component();
                    c.set('initialData', route.getData?.(c));
                    c.set('currentRoute', curRouteComponent.default);
                    c.set('currentRouteTitle', route.title || '');
                    c.set('currentRouteComponentPath', route.componentPath || null);
                    await next();    
                }
            );
        }
    });
    // app.get('/*', checkRoutes());
}
