import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, resolve } from 'node:path';
import { transform } from '@svgr/core';
import jsxPlugin from '@svgr/plugin-jsx';

const SVG_FILTER = /\.svg$/;
const JS_ISSUER_FILTER = /\.[cm]?[jt]sx?$/;

function toComponentName(filePath) {
    const baseName = basename(filePath, extname(filePath));

    return baseName
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') || 'SvgComponent';
}

export default function svgrPlugin() {
    return {
        name: 'svgr-component',
        setup(build) {
            build.onResolve({ filter: SVG_FILTER }, async (args) => {
                if (args.importer && !JS_ISSUER_FILTER.test(args.importer)) {
                    return null;
                }

                return {
                    path: isAbsolute(args.path)
                        ? args.path
                        : resolve(args.resolveDir, args.path),
                    namespace: 'svgr-component',
                };
            });

            build.onLoad({ filter: SVG_FILTER, namespace: 'svgr-component' }, async (args) => {
                const svgContents = await readFile(args.path, 'utf8');
                const contents = await transform(
                    svgContents,
                    {
                        jsxRuntime: 'automatic',
                        exportType: 'default',
                        plugins: [jsxPlugin],
                    },
                    {
                        componentName: toComponentName(args.path),
                        filePath: args.path,
                    },
                );

                return {
                    contents,
                    loader: 'jsx',
                    resolveDir: dirname(args.path),
                };
            });
        },
    };
}
