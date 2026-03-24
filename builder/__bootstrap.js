import { hydrateRoot } from 'react-dom/client';
import createRouter from '../router/createRouter.js';
import { createElement } from 'react';

async function hydrateApplication() {
    const [AppCore, App, CurrentRoute, routes] = await Promise.all([
            import('./AppCore.js'),
            import('./SiteApp.js'),
            import('./CurrentRoute.js'),
            import('./routes.js')  
        ]),
        router = createRouter(routes.default),
        initialRoute = router.resolve(window.location),
        InitialComponent = await initialRoute.component();
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
            router
            // content: ContentComponent && createElement(ContentComponent),
            // apiData
        }, createElement(App.default, {
            path: location
        }, createElement(CurrentRoute.default, {
            path: location, 
            component: InitialComponent?.default
        })))
    );
}
hydrateApplication();