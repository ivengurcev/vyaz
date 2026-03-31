import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import ApplicationContext from '../Context.js';
import { SessionProvider } from '@hono/auth-js/react';

import '../authSetup.js';

function AuthProvider({children}) {
    return typeof window === 'undefined'  
        ? children
        : <SessionProvider>{children}</SessionProvider>;
}
AuthProvider.propTypes = {
    children: PropTypes.node,
};


/**
 * Подкладывает в контекст активный компонент содержимого приложения.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function ApplicationCore({
    children,
    component: initialComponent,
    authUser,
    path,
    router,
}) {
    const [routeComponent, setRouteComponent] = useState(initialComponent),
        [pathname, setPathname] = useState(path?.pathname || '/');

    async function navigate(href, options = {}) {
        if (typeof window === 'undefined' || !router) {
            return;
        }

        const targetUrl = new URL(href, window.location.origin),
            nextRoute = router.resolve(targetUrl);

        if (!nextRoute) {
            window.location.href = href;
            return;
        }

        const nextComponent = await nextRoute.component();

        if (options.replace) {
            window.history.replaceState({}, '', targetUrl);
        } else {
            window.history.pushState({}, '', targetUrl);
        }

        setPathname(targetUrl.pathname);
        setRouteComponent(nextComponent?.default || null);
    }

    useEffect(() => {
        if (typeof window === 'undefined' || !router) {
            return undefined;
        }

        async function syncRoute() {
            const nextRoute = router.resolve(window.location);

            if (!nextRoute) {
                return;
            }

            const nextComponent = await nextRoute.component();

            setPathname(window.location.pathname);
            setRouteComponent(nextComponent?.default || null);
        }

        function handlePopState() {
            syncRoute();
        }

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        }
    }, [router]);

    return (<AuthProvider>
        <ApplicationContext.Provider
            value={{
                routeComponent,
                authUser,
                pathname,
                navigate,
            }}
        >
            {children}
        </ApplicationContext.Provider>
    </AuthProvider>);
}

ApplicationCore.propTypes = {
    children: PropTypes.node,
    component: PropTypes.elementType,
    authUser: PropTypes.any,
    path: PropTypes.any,
    router: PropTypes.any,
};
