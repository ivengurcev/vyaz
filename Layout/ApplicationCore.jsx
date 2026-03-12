// import { useMemo } from 'react';
import ApplicationContext from '../Context.js';
export default function ApplicationCore({children, content: ContentComponent}) {
    // console.log(content);
    return (<ApplicationContext.Provider
        value={{
            content: ContentComponent && <ContentComponent />
        }}
    >
        {children}
    </ApplicationContext.Provider>);
}