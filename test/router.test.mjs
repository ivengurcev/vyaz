import assert from 'node:assert/strict';
import test from 'node:test';
import { Hono } from 'hono';
import { attachRouter } from '../server/router.mjs';

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
