function compileRouteRegexp(path) {
    const pattern = String(path || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/:([^/]+)/g, '[^/]+');

    return new RegExp(`^${pattern}$`);
}

export default function createRouter(routes) {
    const preparedRoutes = routes.map(route => ({
        ...route,
        regexp: compileRouteRegexp(route.path),
    }));

    return {
        resolve(route) {
            return preparedRoutes.find(({regexp}) => regexp.test(route.pathname));
        }
    }
}
