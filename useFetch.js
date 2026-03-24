import { useMemo, useState } from 'react';

export default function useFetch(path) {
    const [refresh, setRefresh] = useState(0),
        fetchQuery =  useMemo(() => {
            const curPath = path.includes('?') 
                ? `${path}&refresh=${refresh}` 
                : `${path}?refresh=${refresh}`;
            return typeof window === 'undefined' 
                ? Promise.resolve(null)
                : fetch(curPath)
                    .then(res => res.json());
        }, [path, refresh]),
        refetch = () => setRefresh((prev) => prev + 1);
    return [fetchQuery, refetch];
}