import { access } from 'node:fs/promises';
import { join } from 'node:path';
import picocolors from 'picocolors';

const workspace = process.cwd();

export default async function getServerCallbacks() {
    const serverPath = join(workspace, 'server.mjs');

    try {
        await access(serverPath);
        return await import(serverPath);
    } catch (e) {
        if (e?.code !== 'ENOENT') {
            console.error(e);
            console.log(picocolors.red(`Не удалось загрузить файл ${serverPath}`));
        }

        return {};
    }
}
