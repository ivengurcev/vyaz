import { access } from 'node:fs/promises';
import { join } from 'node:path';
import picocolors from 'picocolors';

const workspace = process.cwd();
export default async function getAuthCallbacks() {
    const apiPath = join(workspace, 'auth.mjs');
    try {
        await access(apiPath);
        const apiRoutes = await import(apiPath);
        return apiRoutes;
    } catch (e) {
        console.error(e);
        console.log(picocolors.red(`Не удалось загрузить файл ${apiPath}`));
        return {};
    }   
}