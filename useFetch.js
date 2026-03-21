import { useMemo, useState } from 'react';


async function serverFetch(query) {
    return await import('./server/fetch.js').then((m) => m.default(query));
}
export default function useFetch(path) {
    const [refresh, setRefresh] = useState(0),
        fetchQuery =  useMemo(() => {
            const curPath = path.includes('?') 
                ? `${path}&refresh=${refresh}` 
                : `${path}?refresh=${refresh}`;
            return typeof window === 'undefined' 
                ? serverFetch(curPath) 
                : fetch(curPath);
        }, [path, refresh]),
        refetch = () => setRefresh((prev) => prev + 1);
    return [fetchQuery, refetch];
}