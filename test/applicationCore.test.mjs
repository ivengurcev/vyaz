import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import getConfigPlugin from '../builder/configPlugin.mjs';

const require = createRequire(import.meta.url);

for (const platform of ['browser', 'node']) {
    for (const enabled of [false, true]) {
        test(`ApplicationCore renders on ${platform} with auth ${enabled ? 'enabled' : 'disabled'}`, async () => {
            const result = await build({
                stdin: {
                    contents: `
                        export { default } from '../Layout/ApplicationCore.jsx';
                        export { calls } from '@hono/auth-js/react';
                    `,
                    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
                },
                bundle: true,
                write: false,
                format: 'cjs',
                platform,
                jsx: 'automatic',
                external: ['react', 'react/jsx-runtime', 'prop-types'],
                define: { window: platform === 'browser' ? '{}' : 'undefined' },
                plugins: [
                    getConfigPlugin({ auth: enabled ? () => ({}) : undefined }),
                    {
                        name: 'observe-auth-calls',
                        setup(builder) {
                            builder.onResolve({ filter: /^@hono\/auth-js\/react$/ }, () => ({
                                path: 'auth', namespace: 'test-auth',
                            }));
                            builder.onLoad({ filter: /.*/, namespace: 'test-auth' }, () => ({
                                contents: `
                                    export const calls = { provider: 0, session: 0 };
                                    export function SessionProvider({ children }) {
                                        calls.provider++;
                                        return children;
                                    }
                                    export function useSession() {
                                        calls.session++;
                                        return { data: { user: null } };
                                    }
                                    export const authConfigManager = {
                                        setConfig() {}, getConfig() { return {}; },
                                    };
                                `,
                            }));
                        },
                    },
                ],
            });
            const module = { exports: {} };
            new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
            const html = renderToStaticMarkup(createElement(
                module.exports.default,
                { path: { pathname: '/' } },
                createElement('p', null, 'Page content'),
            ));

            assert.equal(html, '<p>Page content</p>');
            assert.deepEqual(module.exports.calls, {
                provider: enabled && platform === 'browser' ? 1 : 0,
                session: enabled ? 1 : 0,
            });
        });
    }
}

test('navigate applies guards, skips the current URL, and preserves changed search and hash', async () => {
    const result = await build({
        stdin: {
            contents: `
                export { default } from '../Layout/ApplicationCore.jsx';
                export { default as Context } from '../Context.js';
            `,
            resolveDir: fileURLToPath(new URL('.', import.meta.url)),
        },
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        jsx: 'automatic',
        external: ['react', 'react/jsx-runtime', 'prop-types'],
        plugins: [getConfigPlugin({})],
    });
    const previousWindow = globalThis.window;
    globalThis.window = { location: { origin: 'http://localhost', href: 'http://localhost/admin?section=appearance' } };
    const module = { exports: {} };
    new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);

    let appContext,
        routeResolutions = 0,
        componentLoads = 0,
        guardCalls = 0,
        historyWrites = 0,
        resolvedSearch = '';
    globalThis.window = {
        location: {
            origin: 'http://localhost',
            href: 'http://localhost/admin?section=appearance',
        },
        history: {
            state: {},
            pushState(state, _title, url) {
                this.state = state;
                historyWrites += 1;
                globalThis.window.location.href = new URL(url).href;
            },
            replaceState(state, _title, url) {
                this.state = state;
                historyWrites += 1;
                globalThis.window.location.href = new URL(url).href;
            },
        },
    };

    try {
        function CaptureContext() {
            appContext = useContext(module.exports.Context);
            return null;
        }

        const router = {
            resolve(url) {
                routeResolutions += 1;
                resolvedSearch = url.search;
                return {
                    component: async () => {
                        componentLoads += 1;
                        return { default: function Page() {} };
                    },
                };
            },
        };
        renderToStaticMarkup(createElement(
            module.exports.default,
            { path: { pathname: '/admin', search: '?section=appearance' }, router },
            createElement(CaptureContext),
        ));

        appContext.setNavigationGuard(() => { guardCalls += 1; return false; });
        await appContext.navigate('/admin?section=appearance');
        assert.equal(routeResolutions, 0);
        assert.equal(guardCalls, 0);
        assert.equal(componentLoads, 0);
        assert.equal(historyWrites, 0);

        await appContext.navigate('/admin/pages');
        assert.equal(guardCalls, 1);
        assert.equal(componentLoads, 0);
        assert.equal(historyWrites, 0);

        appContext.setNavigationGuard(() => { guardCalls += 1; return true; });
        await appContext.navigate('/admin/pages');
        assert.equal(componentLoads, 1);
        assert.equal(historyWrites, 1);

        appContext.setNavigationGuard(() => { guardCalls += 1; return false; });
        await appContext.navigate('/admin/pages?section=contacts#details', { skipGuard: true });
        assert.equal(guardCalls, 2);
        assert.equal(componentLoads, 2);
        assert.equal(historyWrites, 2);
        assert.equal(resolvedSearch, '?section=contacts');
        assert.equal(globalThis.window.location.href, 'http://localhost/admin/pages?section=contacts#details');
    } finally {
        if (previousWindow === undefined) delete globalThis.window;
        else globalThis.window = previousWindow;
    }
});
