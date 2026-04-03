import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    CORE_ROOT = dirname(__dirname),
    CORE_FILTER = /^@farrage\/core(?:\/(.*))?$/;

export default function workspaceCorePlugin() {
    return {
        name: 'workspace-core-plugin',
        setup(build) {
            build.onResolve({ filter: CORE_FILTER }, ({ path }) => {
                const [, subpath] = path.match(CORE_FILTER) || [];

                return {
                    path: subpath ? join(CORE_ROOT, subpath) : CORE_ROOT,
                };
            });
        },
    };
}
