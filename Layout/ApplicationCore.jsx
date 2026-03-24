import PropTypes from 'prop-types';
import ApplicationContext from '../Context.js';
import { SessionProvider, authConfigManager } from '@hono/auth-js/react';

authConfigManager.setConfig({
    basePath: '/auth'
});

function AuthProvider({children}) {
    return typeof window === 'undefined'  
        ? children
        : <SessionProvider>{children}</SessionProvider>;
}
AuthProvider.propTypes = {
    children: PropTypes.node,
};


/**
 * Подкладывает в контекст активный компонент содержимого приложения.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function ApplicationCore({children, content: ContentComponent}) {
    return (<AuthProvider>
        <ApplicationContext.Provider
            value={{
                content: ContentComponent && <ContentComponent />
            }}
        >
            {children}
        </ApplicationContext.Provider>
    </AuthProvider>);
}

ApplicationCore.propTypes = {
    children: PropTypes.node,
    content: PropTypes.elementType,
};
