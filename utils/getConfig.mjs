
import pc from 'picocolors';
const workspace = process.cwd();
            
export default async function getServerConfig() {
    try {
        return await import(`${workspace}/config.mjs`);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        console.log(pc.red(`Не удалось загрузить файл ${workspace}/config.mjs`));
        return {};
    }
}