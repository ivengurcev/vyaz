function compileRouteRegexp(path) {
    const pattern = String(path || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/:([^/]+)/g, '[^/]+');

    return new RegExp(`^${pattern}$`);
}

export default function createRouter(routes) {
    const preparedRoutes = routes
        .map((route, index) => ({
            ...route,
            index,
            regexp: compileRouteRegexp(route.path),
            staticSegments: String(route.path || '').split('/').filter(segment => segment && !segment.startsWith(':')).length,
            dynamicSegments: String(route.path || '').split('/').filter(segment => segment.startsWith(':')).length,
        }))
        .sort((a, b) => b.staticSegments - a.staticSegments
            || a.dynamicSegments - b.dynamicSegments
            || b.path.length - a.path.length
            || a.index - b.index);

    return {
        resolve(route) {
            return preparedRoutes.find(({regexp}) => regexp.test(route.pathname));
        }
    }
}
