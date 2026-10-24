import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
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
