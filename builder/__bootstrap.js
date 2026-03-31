import { hydrateRoot } from 'react-dom/client';
import createRouter from '../router/createRouter.js';
import { createElement } from 'react';
import normalizeRouteComponent from '../Layout/normalizeRouteComponent.js';

function getInitialData() {
    const rootData = document.getElementById('api-data');

    if (!rootData?.textContent) {
        return {};
    }

    try {
        return JSON.parse(rootData.textContent);
    } catch {
        return {};
    }
}

async function hydrateApplication() {
    const [AppCore, App, CurrentRoute, routes] = await Promise.all([
            import('./AppCore.js'),
            import('./SiteApp.js'),
            import('./CurrentRoute.js'),
            import('./routes.js')  
        ]),
        initialData = getInitialData(),
        router = createRouter(routes.default),
        initialRoute = router.resolve(window.location),
        InitialComponent = normalizeRouteComponent(await initialRoute.component());


    // console.log('initialData', initialData);
    // hydrateRoot(
    //     document.getElementById('root'),
    //     <AppCore.default path={location} router={router}>
    //         <App.default path={location}>
    //             <CurrentRoute.default path={location} component={InitialComponent?.default} />
    //         </App.default>
    //     </AppCore.default>
    // );
    hydrateRoot(
        document.getElementById('root'),
        createElement(AppCore.default, { // AppCore
            path: location, 
            router,
            component: InitialComponent,
            authUser: initialData?.authUser || null,
        }, createElement(App.default, {
            path: location
        }, createElement(CurrentRoute.default, {
            path: location, 
            component: InitialComponent
        })))
    );
}
hydrateApplication();
