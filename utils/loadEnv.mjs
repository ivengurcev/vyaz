import pc from 'picocolors';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename),
    defaults = {
        PORT: 3000,
        DATABASE_URL: '',
        OUTDIR: './dist',    
        STATIC_PATH: '/public',
        LAYOUT_HTML: resolve(__dirname, '../Layout/Layout.jsx'),
        LAYOUT_APP: resolve(__dirname, '../Layout/Application.jsx'),
        PAGE_TITLE: ''
    };


export default function loadEnv() {
    try {
        process.loadEnvFile();
        return {...defaults, ...process.env};
    } catch (e) {
        console.log(pc.red('Не удалось загрузиьть файл .env'));
        return {};
    }
}