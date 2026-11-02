import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import getStringRoute from '../builder/utils/getStringRoute.mjs';

const require = createRequire(import.meta.url);

test('SSR route metadata excludes CSR component imports while the client keeps them', () => {
    const routes = [
        { path: '/admin', component: './Pages/Admin.jsx', disableSSR: true, title: 'Admin' },
        { path: '/home', component: './Pages/Home.jsx' },
    ];

    const serverRoutes = getStringRoute(routes, true),
        clientRoutes = getStringRoute(routes);

    assert.ok(serverRoutes.includes('path: "/admin"'));
    assert.match(serverRoutes, /disableSSR: true/);
    assert.doesNotMatch(serverRoutes, /Pages\/Admin\.jsx/);
    assert.match(serverRoutes, /Pages\/Home\.jsx/);
    assert.match(clientRoutes, /Pages\/Admin\.jsx/);
});

test('the HTML layout renders an empty root while retaining title, assets, and auth data', () => {
    const result = build({
        stdin: {
            contents: "export { default } from '../Layout/Layout.jsx';",
            resolveDir: fileURLToPath(new URL('.', import.meta.url)),
        },
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        jsx: 'automatic',
        external: ['react', 'react/jsx-runtime', 'prop-types'],
    });

    return result.then(({outputFiles}) => {
        const module = { exports: {} };
        new Function('require', 'module', 'exports', outputFiles[0].text)(require, module, module.exports);
        const ApplicationHTML = module.exports.default,
            html = renderToStaticMarkup(createElement(ApplicationHTML, {
                title: 'Admin',
                scripts: ['/public/index.js'],
                styles: ['/public/index.css'],
                apiData: { user: { id: 'user-1' } },
            }));

        assert.match(html, /<title>Admin<\/title>/);
        assert.match(html, /<script type="module" defer="" src="\/public\/index\.js"><\/script>/);
        assert.match(html, /<link rel="stylesheet" href="\/public\/index\.css"\/>/);
        assert.match(html, /<script type="application\/json" id="api-data">\{"user":\{"id":"user-1"\}\}<\/script>/);
        assert.match(html, /<div id="root"><\/div>/);
    });
});
