import { useMemo, useState } from 'react';


async function serverFetch(query) {
    return await import('./server/fetch.js').then((m) => m.default(query));
}
export default function useFetch(path) {
    const [refresh, setRefresh] = useState(0),
        query = useMemo(() => path.contains('?') 
            ? `${path}&refresh=${refresh}` 
            : `${path}?refresh=${refresh}`
        , [path, refresh]),
        fetchQuery =  useMemo(() => typeof window === 'undefined' 
            ? serverFetch(query) 
            : fetch(query), [query]),
        refetch = () => setRefresh((prev) => prev + 1);
    return [fetchQuery, refetch];
}