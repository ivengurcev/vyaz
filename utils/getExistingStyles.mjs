import { access } from 'node:fs/promises';
import { join } from 'node:path';
import resolvePath from '../builder/utils/resolvePath.mjs';

export default async function getExistingStyles({OUTDIR, PUBLIC_PATH}) {
    const files = ['index.css', 'SiteApp.css'];

    return (await Promise.all(files.map(async file => {
        try {
            await access(join(resolvePath(OUTDIR), PUBLIC_PATH.replace(/^\/+/, ''), file));
            return join(PUBLIC_PATH, file);
        } catch {
            return null;
        }
    }))).filter(Boolean);
}
