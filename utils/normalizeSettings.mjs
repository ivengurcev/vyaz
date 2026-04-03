import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);

function normalizePath(path) {
    return `/${String(path).replace(/^\/+|\/+$/g, '')}`;
}

export default function normalizeSettings(settings) {
        const  {    
                PORT: _PORT,
                SERVER_URL: _SERVER_URL,
                AUTH_URL: _AUTH_URL
            } = settings,
            AUTH_URL = normalizePath(_AUTH_URL || '/auth'),
            PORT = _PORT || 3000,
            SERVER_URL = _SERVER_URL || 'http://localhost:' + PORT;
    return {
        ...settings,
        PORT,
        SERVER_URL,
        AUTH_URL,
        OUTDIR: settings?.OUTDIR || './dist',    
        PUBLIC_PATH: normalizePath(settings?.PUBLIC_PATH || '/public'),
        STATIC_PATH: normalizePath(settings?.STATIC_PATH || '/static'),
        LAYOUT_HTML: settings?.LAYOUT_HTML || resolve(__dirname, '../Layout/Layout.jsx'),
        LAYOUT_APP: settings?.LAYOUT_APP || resolve(__dirname, '../Layout/Application.jsx'),
        PAGE_TITLE: settings?.PAGE_TITLE || '',
        API_ROOT: normalizePath(settings?.API_ROOT || '/api'),
        AUTH_SIGNIN: normalizePath(settings?.AUTH_SIGNIN || (AUTH_URL + '/signin')),
        ASSET_PUBLIC_BASE: normalizePath(settings?.ASSET_PUBLIC_BASE || '/uploads'),
        LAYOUT_AUTH: settings?.LAYOUT_AUTH || '',        
    };
}