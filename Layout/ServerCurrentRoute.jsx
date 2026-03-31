import PropTypes from 'prop-types';
import { createElement } from 'react';
import normalizeRouteComponent from './normalizeRouteComponent.js';

/**
 * Разрешает компонент маршрута на сервере и возвращает его разметку.
 *
 * @param {object} props
 * @returns {Promise<JSX.Element|null>}
 */
function CurrentComponent({component}) {
    const Content = normalizeRouteComponent(component);

    if (!Content) {
        return null;
    }

    return createElement(Content);
}

CurrentComponent.propTypes = {
    component: PropTypes.any,
};

/**
 * Рендерит текущий маршрут на сервере в той же форме, что и на клиенте.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function CurrentRoute({
    component
}) {
    return <CurrentComponent component={component} />;
}

CurrentRoute.propTypes = {
    route: PropTypes.any,
    component: PropTypes.elementType,
};
