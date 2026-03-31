import PropTypes from 'prop-types';
import { createElement, useContext } from 'react';
import ApplicationContext from '../Context.js';
import normalizeRouteComponent from './normalizeRouteComponent.js';

/**
 * Разрешает лениво загруженный компонент и рендерит его на клиенте.
 *
 * @param {object} props
 * @returns {JSX.Element|null}
 */
function CurrentComponent({component}) {
    const Component = normalizeRouteComponent(component);

    if (!Component) {
        return null;
    }

    return createElement(Component);
}

CurrentComponent.propTypes = {
    component: PropTypes.any,
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
        currentComponent = routeComponent || component;

    return <CurrentComponent component={currentComponent} />;
}

CurrentRoute.propTypes = {
    route: PropTypes.any,
    component: PropTypes.elementType,
};
