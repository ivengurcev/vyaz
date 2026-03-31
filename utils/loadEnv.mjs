import pc from 'picocolors';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);

export default function loadEnv() {
    try {
        process.loadEnvFile();
        const PORT = process.env.PORT || 3000,
            AUTH_URL = process.env.AUTH_URL || '/auth';
        return {
            ...{
                PORT,
                DATABASE_URL: '',
                OUTDIR: './dist',    
                STATIC_PATH: '/public',
                LAYOUT_HTML: resolve(__dirname, '../Layout/Layout.jsx'),
                LAYOUT_APP: resolve(__dirname, '../Layout/Application.jsx'),
                PAGE_TITLE: '',
                API_ROOT: '/api',
                AUTH_URL,
                AUTH_SIGNIN: AUTH_URL + '/signin',
                LAYOUT_AUTH: '',
                SERVER_URL: 'http://localhost:' + PORT                
            }, 
            ...process.env,
        };
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        console.log(pc.red('Не удалось загрузиьть файл .env'));
        return {};
    }
}