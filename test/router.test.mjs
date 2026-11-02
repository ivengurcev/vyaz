import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { attachRouter } from '../server/router.mjs';
import createRouter from '../router/createRouter.js';

test('the first matching route is not overwritten by an overlapping dynamic route', async () => {
    const app = new Hono(),
        NewPage = () => null,
        PersonPage = () => null;

    await attachRouter(app, {
        routes: [
            {
                path: '/persons/new',
                title: 'New person',
                component: async () => ({ default: NewPage }),
                getData: () => ({ page: 'new' }),
            },
            {
                path: '/persons/:personId',
                title: 'Person',
                component: async () => ({ default: PersonPage }),
                getData: () => ({ page: 'person' }),
            },
        ],
        AUTH_SIGNIN: '/auth/signin',
    });
    app.get('*', async (c) => c.json({
        component: c.get('currentRoute') === NewPage ? 'new' : 'person',
        data: await Promise.resolve(c.get('initialData')),
        title: c.get('currentRouteTitle'),
    }));

    assert.deepEqual(await (await app.request('/persons/new')).json(), {
        component: 'new',
        data: { page: 'new' },
        title: 'New person',
    });
    assert.deepEqual(await (await app.request('/persons/17')).json(), {
        component: 'person',
        data: { page: 'person' },
        title: 'Person',
    });
});

test('passes Hono context to page access checks and supports two-argument callbacks', async () => {
    const app = new Hono();
    let receivedContext;
    await attachRouter(app, {
        routes: [{
            path: '/private',
            component: async () => ({ default: () => null }),
            isPrivate: false,
        }],
        hasAccess(user, route, context) {
            receivedContext = context;
            return context.req.path === '/private';
        },
        AUTH_SIGNIN: '/auth/signin',
    });
    app.get('*', (c) => c.text('ok'));

    const response = await app.request('/private');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'ok');
    assert.equal(receivedContext.req.path, '/private');

    const twoArgumentApp = new Hono();
    await attachRouter(twoArgumentApp, {
        routes: [{ path: '/legacy', component: async () => ({ default: () => null }) }],
        hasAccess(user, route) { return route.path === '/legacy'; },
        AUTH_SIGNIN: '/auth/signin',
    });
    twoArgumentApp.get('*', (c) => c.text('ok'));
    assert.equal((await twoArgumentApp.request('/legacy')).status, 200);
});

test('matches a CSR route without importing its component or preparing SSR data', async () => {
    const app = new Hono();
    let componentImports = 0,
        dataCalls = 0,
        accessCalls = 0;

    await attachRouter(app, {
        routes: [{
            path: '/admin',
            component: async () => {
                componentImports++;
                return { default: () => null };
            },
            componentPath: './AdminPage.jsx',
            title: 'Admin',
            isPrivate: false,
            disableSSR: true,
            getData() {
                dataCalls++;
                return { secret: 'ssr-only' };
            },
        }],
        hasAccess() {
            accessCalls++;
            return true;
        },
        AUTH_SIGNIN: '/auth/signin',
    });
    app.get('*', (c) => c.json({
        matched: c.get('currentRouteMatched'),
        component: c.get('currentRoute'),
        title: c.get('currentRouteTitle'),
        componentPath: c.get('currentRouteComponentPath'),
        initialData: c.get('initialData'),
    }));

    assert.deepEqual(await (await app.request('/admin')).json(), {
        matched: true,
        title: 'Admin',
        componentPath: './AdminPage.jsx',
    });
    assert.equal(componentImports, 0);
    assert.equal(dataCalls, 0);
    assert.equal(accessCalls, 1);
});

test('client route matching prefers static paths over overlapping dynamic paths', () => {
    const router = createRouter([
        { path: '/persons/:personId' },
        { path: '/persons/new' },
        { path: '/:section/:item/edit' },
        { path: '/persons/:personId/edit' },
    ]);

    assert.equal(router.resolve(new URL('http://localhost/persons/new')).path, '/persons/new');
    assert.equal(router.resolve(new URL('http://localhost/persons/17/edit')).path, '/persons/:personId/edit');
});

test('server routing prefers the more specific intersecting dynamic path', async () => {
    const app = new Hono();

    await attachRouter(app, {
        routes: [
            {
                path: '/:section/:item/edit',
                component: async () => ({ default: () => null }),
                title: 'Generic edit',
            },
            {
                path: '/persons/:personId/edit',
                component: async () => ({ default: () => null }),
                title: 'Person edit',
            },
        ],
        AUTH_SIGNIN: '/auth/signin',
    });
    app.get('*', (c) => c.text(c.get('currentRouteTitle')));

    assert.equal(await (await app.request('/persons/17/edit')).text(), 'Person edit');
});

test('a private CSR route still requires configured authentication', async () => {
    const app = new Hono();
    let componentImports = 0;

    await attachRouter(app, {
        routes: [{
            path: '/admin',
            isPrivate: true,
            disableSSR: true,
            component: async () => {
                componentImports++;
                return { default: () => null };
            },
        }],
        AUTH_SIGNIN: '/auth/signin',
    });
    app.get('*', (c) => c.text('page shell'));

    const response = await app.request('/admin');

    assert.equal(response.status, 503);
    assert.equal(componentImports, 0);
});
