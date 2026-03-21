// import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ApplicationContext from '../Context.js';

/**
 * Подкладывает в контекст активный компонент содержимого приложения.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
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

ApplicationCore.propTypes = {
    children: PropTypes.node,
    content: PropTypes.elementType,
};
