import { useMemo, useState } from 'react';
import apiFetch from './apiFetch';

export default function useFetch(path) {
    const [refresh, setRefresh] = useState(0),
        fetchQuery =  useMemo(() => {
            const curPath = path.includes('?') 
                ? `${path}&refresh=${refresh}` 
                : `${path}?refresh=${refresh}`;
            return apiFetch(curPath).then(res => res.json());
        }, [path, refresh]),
        refetch = () => setRefresh((prev) => prev + 1);
    return [fetchQuery, refetch];
}