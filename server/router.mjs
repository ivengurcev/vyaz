import { verifyAuthRedirect } from './auth.mjs';

export async function attachRouter(app, {routes, ...settings}) {
    // const {hasAccess} = auth?.() || {};
    // console.log(routes);
    routes.forEach(route => {
        if(route.path) {
            app.get(
                route.path, 
                verifyAuthRedirect(route.isPrivate, settings),
                async (c, next) => {
                    if(route.isPrivate && route.hasAccess) {
                        const authUser = c.get('authUser'),
                            accessGranted = await route.hasAccess(authUser);
                        if (!accessGranted) {
                            return c.text('Недостаточно прав для доступа к странице', 403);
                        }
                    }
                    return next();
                },
                async (c, next) => {
                    const curRouteComponent = await route.component();
                    c.set('initialData', route.getData?.(c));
                    c.set('currentRoute', curRouteComponent.default);
                    c.set('currentRouteTitle', route.title || '');
                    await next();    
                }
            );
        }
    });
    // app.get('/*', checkRoutes());
}
