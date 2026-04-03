import { hydrateRoot } from 'react-dom/client';
import { createElement } from 'react';
import normalizeRouteComponent from '../Layout/normalizeRouteComponent.js';
import router from '__router__';

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
    const [AppCore, App, CurrentRoute] = await Promise.all([
            import('./AppCore.js'),
            import('./SiteApp.js'),
            import('./CurrentRoute.js')
        ]),
        initialData = getInitialData(),
        initialRoute = router.resolve(window.location),
        InitialComponent = normalizeRouteComponent(await initialRoute.component());

    hydrateRoot(
        document.getElementById('root'),
        createElement(AppCore.default, { // AppCore
            path: location, 
            router,
            component: InitialComponent,
            user: initialData?.user || null,
            initialData,
        }, createElement(App.default, {
            path: location
        }, createElement(CurrentRoute.default, {
            path: location, 
            component: InitialComponent
        })))
    );
}
hydrateApplication();
