import { readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import resolvePath from '../builder/utils/resolvePath.mjs';

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.mjs'];
const IMPORT_PATTERN = /import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_PATTERN = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const INITIAL_DATA_PATTERN = /initialData(?:\?\.|\.)\s*([A-Za-z0-9_]+)/g;

function toKebabCase(value = '') {
    return String(value)
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^A-Za-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

async function resolveImportPath(fromFilePath, importPath) {
    if (!importPath) {
        return null;
    }

    if (importPath.startsWith('@vyaz/core/')) {
        return resolvePath(importPath);
    }

    if (!importPath.startsWith('.')) {
        return null;
    }

    const basePath = join(dirname(fromFilePath), importPath),
        candidates = extname(basePath)
            ? [basePath]
            : [
                ...SOURCE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
                ...SOURCE_EXTENSIONS.map((extension) => join(basePath, `index${extension}`)),
            ];

    for (const candidate of candidates) {
        try {
            await readFile(candidate, 'utf8');
            return candidate;
        } catch {
            continue;
        }
    }

    return null;
}

async function collectSourceFiles(entryFilePath, visited = new Map()) {
    if (!entryFilePath || visited.has(entryFilePath)) {
        return visited;
    }

    let source = '';

    try {
        source = await readFile(entryFilePath, 'utf8');
    } catch {
        return visited;
    }

    visited.set(entryFilePath, source);

    const importPaths = [
        ...source.matchAll(IMPORT_PATTERN),
        ...source.matchAll(DYNAMIC_IMPORT_PATTERN),
    ].map(([, importPath]) => importPath);

    for (const importPath of importPaths) {
        const resolvedImportPath = await resolveImportPath(entryFilePath, importPath);

        if (resolvedImportPath) {
            await collectSourceFiles(resolvedImportPath, visited);
        }
    }

    return visited;
}

function collectInitialDataKeys(fileSources) {
    const keys = new Set();

    for (const source of fileSources.values()) {
        for (const [, key] of source.matchAll(INITIAL_DATA_PATTERN)) {
            keys.add(key);
        }
    }

    return [...keys];
}

async function requestInternalJson(app, c, url) {
    const request = new Request(url, {
        method: 'GET',
        headers: new Headers(c.req.raw.headers),
    });
    const response = await app.fetch(request, c.env);
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok || !contentType.includes('application/json')) {
        return undefined;
    }

    return await response.json();
}

function getRouteMethod(options = {}) {
    return String(options?.method || 'GET').toUpperCase();
}

function resolveInitialDataEndpoint(key, apiRoutes = []) {
    const normalizedKey = `/${toKebabCase(key)}`,
        readableRoutes = apiRoutes
            .filter(([routePath, options]) =>
                typeof routePath === 'string' &&
                !routePath.includes(':') &&
                getRouteMethod(options) === 'GET'
            );

    const exactMatch = readableRoutes.find(([routePath]) => routePath === normalizedKey);

    if (exactMatch) {
        return exactMatch[0];
    }

    const suffixMatch = readableRoutes.find(([routePath]) => routePath.endsWith(normalizedKey));

    return suffixMatch?.[0] || null;
}

export default async function collectRouteInitialData(app, c, {
    API_ROOT,
    componentPath,
    api = [],
} = {}) {
    if (!componentPath) {
        return {};
    }

    const fileSources = await collectSourceFiles(resolvePath(componentPath)),
        initialDataKeys = collectInitialDataKeys(fileSources),
        initialDataEntries = await Promise.all(initialDataKeys.map(async (key) => {
            const endpoint = resolveInitialDataEndpoint(key, api);

            if (!endpoint || endpoint.includes(':')) {
                return null;
            }

            const requestUrl = new URL(`${API_ROOT}${endpoint}`, c.req.url),
                data = await requestInternalJson(app, c, requestUrl);

            if (typeof data === 'undefined') {
                return null;
            }

            return [key, data];
        }));

    return Object.fromEntries(initialDataEntries.filter(Boolean));
}
