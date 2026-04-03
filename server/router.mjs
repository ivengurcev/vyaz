import { verifyAuthRedirect } from './auth.mjs';

export async function attachRouter(app, {routes, hasAccess, ...settings}) {
    // const {hasAccess} = auth?.() || {};
    // console.log(routes);
    routes.forEach(route => {
        if(route.path) {
            app.get(
                route.path, 
                verifyAuthRedirect(route.isPrivate, settings),
                (c, next) => {
                    if(route.isPrivate && hasAccess) {
                        const authUser = c.get('authUser');
                        if (route.permissions?.length > 0 && !hasAccess(authUser, route)) {
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
