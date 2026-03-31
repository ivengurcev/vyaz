export default function apiFetch(path) {
    return typeof window !== 'undefined'
        ? fetch(path)
        : import('./server/fetch.js').then(({default: fetch}) => fetch(path));
}