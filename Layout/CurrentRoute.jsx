import { Suspense, use } from 'react';

function CurrentComponent({query}) {
    const Component = query && use(query);
    return <Component />;
}

export default function CurrentRoute({route, component, ...props}) {
    const queryGetComponent = component && Promise.resolve(component);
    return (<Suspense>
        <CurrentComponent query={queryGetComponent} />
    </Suspense>);
}