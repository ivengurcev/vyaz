import {join} from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export default function resolvePath(p) {
    if(p.startsWith('/')) {
        return p;
    } else if(p.startsWith('.')) {
        return join(process.cwd(), p);
    } else return require.resolve(p);
}