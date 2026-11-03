import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import ApplicationContext from '../Context.js';
import { SessionProvider, useSession } from '@hono/auth-js/react';
import { AUTH_ENABLED } from '__config__';
import normalizeRouteComponent from './normalizeRouteComponent.js';

import '../authSetup.js';

function AuthProvider({children}) {
    return !AUTH_ENABLED || typeof window === 'undefined'
        ? children
        : <SessionProvider>{children}</SessionProvider>;
}
AuthProvider.propTypes = {
    children: PropTypes.node,
};

function SessionSync({ setUser }) {
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
    return null;
}
SessionSync.propTypes = {
    setUser: PropTypes.func,
};

function ApplicationStateProvider({
    children,
    routeComponent,
    user,
    setUser,
    initialData,
    pathname,
    search,
    navigate,
    setNavigationGuard,
}) {
    return (
        <ApplicationContext.Provider
            value={{
                routeComponent,
                user,
                setUser,
                initialData: initialData || {},
                pathname,
                search,
                navigate,
                setNavigationGuard,
            }}
        >
            {AUTH_ENABLED && <SessionSync setUser={setUser} />}
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
    search: PropTypes.string,
    navigate: PropTypes.func,
    setNavigationGuard: PropTypes.func,
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
        [search, setSearch] = useState(path?.search || ''),
        [user, setUser] = useState(initialUser || null);
    const navigationGuardRef = useRef(null);
    const setNavigationGuard = useCallback((guard) => {
        if (guard !== null && typeof guard !== 'function') {
            throw new TypeError('Navigation guard must be a function or null.');
        }
        navigationGuardRef.current = guard;
    }, []);
    const historyIndexRef = useRef(0);
    const restoringHistoryRef = useRef(false);

    const navigate = useCallback(async (href, options = {}) => {
        if (typeof window === 'undefined' || !router) {
            return;
        }

        const targetUrl = new URL(href, window.location.origin);

        if (targetUrl.href === window.location.href) return;

        const nextRoute = router.resolve(targetUrl);

        if (!options.skipGuard && navigationGuardRef.current && !await navigationGuardRef.current({
            from: new URL(window.location.href),
            to: targetUrl,
            type: 'navigate',
        })) return;

        if (!nextRoute?.component) {
            window.location.href = href;
            return;
        }

        const nextComponent = await nextRoute.component();

        if (options.replace) {
            window.history.replaceState({ ...window.history.state, __vyazIndex: historyIndexRef.current }, '', targetUrl);
        } else {
            historyIndexRef.current += 1;
            window.history.pushState({ __vyazIndex: historyIndexRef.current }, '', targetUrl);
        }

        setPathname(targetUrl.pathname);
        setSearch(targetUrl.search);
        setRouteComponent(() => normalizeRouteComponent(nextComponent));
    }, [router]);

    useEffect(() => {
        if (typeof window === 'undefined' || !router) {
            return undefined;
        }

        if (typeof window.history.state?.__vyazIndex === 'number') {
            historyIndexRef.current = window.history.state.__vyazIndex;
        } else {
            window.history.replaceState({ ...window.history.state, __vyazIndex: historyIndexRef.current }, '', window.location.href);
        }

        async function syncRoute() {
            const nextRoute = router.resolve(window.location);

            if (!nextRoute) {
                return;
            }

            const nextComponent = await nextRoute.component();

            setPathname(window.location.pathname);
            setSearch(window.location.search);
            setRouteComponent(() => normalizeRouteComponent(nextComponent));
        }

        async function handlePopState(event) {
            if (restoringHistoryRef.current) {
                restoringHistoryRef.current = false;
            } else if (navigationGuardRef.current && !await navigationGuardRef.current({
                from: new URL(`${pathname}${search}`, window.location.origin),
                to: new URL(window.location.href),
                type: 'popstate',
            })) {
                const targetIndex = event.state?.__vyazIndex;
                const delta = typeof targetIndex === 'number' ? historyIndexRef.current - targetIndex : 0;
                if (delta) {
                    restoringHistoryRef.current = true;
                    window.history.go(delta);
                } else {
                    restoringHistoryRef.current = true;
                    window.history.forward();
                }
                return;
            }

            if (typeof event.state?.__vyazIndex === 'number') historyIndexRef.current = event.state.__vyazIndex;
            syncRoute();
        }

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        }
    }, [router, pathname, search]);

    return (<AuthProvider>
        <ApplicationStateProvider
            routeComponent={routeComponent}
            user={user}
            setUser={setUser}
            initialData={initialData}
            pathname={pathname}
            search={search}
            navigate={navigate}
            setNavigationGuard={setNavigationGuard}
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
