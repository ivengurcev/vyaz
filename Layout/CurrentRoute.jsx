import PropTypes from 'prop-types';
import { createElement, Suspense, use } from 'react';

/**
 * Разрешает лениво загруженный компонент и рендерит его на клиенте.
 *
 * @param {object} props
 * @returns {JSX.Element|null}
 */
function CurrentComponent({query}) {
    const Component = query && use(query);
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
    const queryGetComponent = component && Promise.resolve(component);
    return (<Suspense>
        <CurrentComponent query={queryGetComponent} />
    </Suspense>);
}

CurrentRoute.propTypes = {
    route: PropTypes.any,
    component: PropTypes.elementType,
};
