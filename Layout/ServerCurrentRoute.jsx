import { Suspense } from 'react';

async function CurrentComponent({query}) {
    // console.log(use, query); 
    // return <Component />;
    const Content = await query;
    return Content && <Content />;
}

export default function CurrentRoute({route, component, ...props}) {
    const queryGetComponent = component && Promise.resolve(component);
    return (<Suspense>
        <CurrentComponent query={queryGetComponent} />
    </Suspense>);
}