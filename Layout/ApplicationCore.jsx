import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import ApplicationContext from '../Context.js';
import { SessionProvider, useSession } from '@hono/auth-js/react';
import normalizeRouteComponent from './normalizeRouteComponent.js';

import '../authSetup.js';

function AuthProvider({children}) {
    return typeof window === 'undefined'  
        ? children
        : <SessionProvider>{children}</SessionProvider>;
}
AuthProvider.propTypes = {
    children: PropTypes.node,
};

function ApplicationStateProvider({
    children,
    routeComponent,
    user,
    setUser,
    initialData,
    pathname,
    navigate,
}) {
    const session = useSession();

    useEffect(() => {
        const sessionUser = session?.data?.user || session?.user || null;

        if (!sessionUser) {
            return;
        }

        setUser((currentUser) => {
            if (!currentUser) {
                return sessionUser;
            }

            return {
                ...currentUser,
                ...sessionUser,
                permissions:
                    sessionUser.permissions || currentUser.permissions || [],
            };
        });
    }, [session, setUser]);
    return (
        <ApplicationContext.Provider
            value={{
                routeComponent,
                user,
                setUser,
                initialData: initialData || {},
                pathname,
                navigate,
            }}
        >
            {children}
        </ApplicationContext.Provider>
    );
}
ApplicationStateProvider.propTypes = {
    children: PropTypes.node,
    routeComponent: PropTypes.any,
    user: PropTypes.any,
    setUser: PropTypes.func,
    initialData: PropTypes.any,
    pathname: PropTypes.string,
    navigate: PropTypes.func,
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
    user: initialUser,
    initialData,
    path,
    router,
}) {
    const [routeComponent, setRouteComponent] = useState(() => normalizeRouteComponent(initialComponent)),
        [pathname, setPathname] = useState(path?.pathname || '/'),
        [user, setUser] = useState(initialUser || null);

    async function navigate(href, options = {}) {
        if (typeof window === 'undefined' || !router) {
            return;
        }

        const targetUrl = new URL(href, window.location.origin),
            nextRoute = router.resolve(targetUrl);

        if (!nextRoute?.component) {
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
        setRouteComponent(() => normalizeRouteComponent(nextComponent));
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
            setRouteComponent(() => normalizeRouteComponent(nextComponent));
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
        <ApplicationStateProvider
            routeComponent={routeComponent}
            user={user}
            setUser={setUser}
            initialData={initialData}
            pathname={pathname}
            navigate={navigate}
        >
            {children}
        </ApplicationStateProvider>
    </AuthProvider>);
}

ApplicationCore.propTypes = {
    children: PropTypes.node,
    component: PropTypes.elementType,
    user: PropTypes.any,
    initialData: PropTypes.any,
    path: PropTypes.any,
    router: PropTypes.any,
};
