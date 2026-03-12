const isBrowser = typeof window !== 'undefined';
export default function createRouter(routes) {
    const preparedRoutes = (isBrowser 
        ? routes.filter(({isServer}) => !isServer) 
        : routes
    ).map(route => ({...route, regexp: new RegExp(`^${route.path}$`)}));
    return {
        resolve(route) {
            return preparedRoutes.find(({regexp}) => regexp.test(route.pathname));
        }
    }
}