import { createRoot, hydrateRoot } from 'react-dom/client';
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
    const initialRoute = router.resolve(window.location);
    if (!initialRoute) {
        return;
    }

    const [AppCore, App, CurrentRoute] = await Promise.all([
            import('./AppCore.js'),
            import('./SiteApp.js'),
            import('./CurrentRoute.js')
        ]),
        initialData = getInitialData(),
        InitialComponent = normalizeRouteComponent(await initialRoute.component()),
        root = document.getElementById('root'),
        application = createElement(AppCore.default, { // AppCore
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
        })));

    if (initialRoute.disableSSR) {
        createRoot(root).render(application);
    } else {
        hydrateRoot(root, application);
    }
}
hydrateApplication();
