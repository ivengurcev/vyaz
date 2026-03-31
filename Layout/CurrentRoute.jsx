import PropTypes from 'prop-types';
import { createElement, isValidElement, Suspense, use, useContext } from 'react';
import ApplicationContext from '../Context.js';

/**
 * Разрешает лениво загруженный компонент и рендерит его на клиенте.
 *
 * @param {object} props
 * @returns {JSX.Element|null}
 */
function CurrentComponent({query}) {
    const resolved = query && use(query),
        Component = resolved?.default || resolved;

    if (!Component) {
        return null;
    }

    if (isValidElement(Component)) {
        return Component;
    }

    return createElement(Component);
}

CurrentComponent.propTypes = {
    query: PropTypes.any,
};

/**
 * Оборачивает текущий маршрут в Suspense и подготавливает компонент к рендеру.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function CurrentRoute({
    // route: _route, 
    component, 
    // ..._props
}) {
    const { routeComponent } = useContext(ApplicationContext) || {},
        queryGetComponent = (routeComponent || component) && Promise.resolve(routeComponent || component);
    return (<Suspense>
        <CurrentComponent query={queryGetComponent} />
    </Suspense>);
}

CurrentRoute.propTypes = {
    route: PropTypes.any,
    component: PropTypes.elementType,
};
