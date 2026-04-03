export default function createRouter(routes) {
    const preparedRoutes = routes.map(route => ({...route, regexp: new RegExp(`^${route.path}$`)}));
    return {
        resolve(route) {
            return preparedRoutes.find(({regexp}) => regexp.test(route.pathname));
        }
    }
}