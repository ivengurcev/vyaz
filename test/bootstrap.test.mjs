import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

async function runBootstrap(disableSSR) {
    const result = await build({
        entryPoints: [fileURLToPath(new URL('../builder/__bootstrap.js', import.meta.url))],
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        plugins: [{
            name: 'bootstrap-test-dependencies',
            setup(builder) {
                builder.onResolve({ filter: /.*/ }, ({ path, importer }) => importer
                    ? ({ path, namespace: 'bootstrap-test' })
                    : undefined);
                builder.onLoad({ filter: /.*/, namespace: 'bootstrap-test' }, ({ path }) => {
                    if (path === 'react-dom/client') {
                        return { contents: `
                            export function createRoot(root) {
                                globalThis.rootCalls.create++;
                                return { render(application) { globalThis.rootCalls.rendered = application; } };
                            }
                            export function hydrateRoot(root, application) {
                                globalThis.rootCalls.hydrate++;
                                globalThis.rootCalls.rendered = application;
                            }
                        `, loader: 'js' };
                    }
                    if (path === 'react') {
                        return { contents: 'export function createElement(type, props, ...children) { return { type, props, children }; }', loader: 'js' };
                    }
                    if (path === '../Layout/normalizeRouteComponent.js') {
                        return { contents: 'export default component => component?.default || component;', loader: 'js' };
                    }
                    if (path === '__router__') {
                        return { contents: `export default { resolve() { return {
                            disableSSR: ${disableSSR},
                            component: async () => ({ default: function Page() {} }),
                        }; } };`, loader: 'js' };
                    }
                    return { contents: 'export default function Component() {}', loader: 'js' };
                });
            },
        }],
    });
    const module = { exports: {} };
    globalThis.rootCalls = { create: 0, hydrate: 0, rendered: null };
    globalThis.location = { pathname: '/' };
    globalThis.window = { location: globalThis.location };
    globalThis.document = {
        getElementById(id) {
            return id === 'api-data' ? { textContent: '{}' } : {};
        },
    };

    new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
    await new Promise(resolve => setTimeout(resolve, 10));
    return globalThis.rootCalls;
}

test('initial CSR route creates a React root instead of hydrating', async () => {
    const calls = await runBootstrap(true);

    assert.equal(calls.create, 1);
    assert.equal(calls.hydrate, 0);
    assert.ok(calls.rendered);
});

test('initial SSR route hydrates the existing server markup', async () => {
    const calls = await runBootstrap(false);

    assert.equal(calls.create, 0);
    assert.equal(calls.hydrate, 1);
    assert.ok(calls.rendered);
});
