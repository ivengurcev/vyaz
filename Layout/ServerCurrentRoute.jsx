import PropTypes from 'prop-types';
import { Suspense } from 'react';

/**
 * Разрешает компонент маршрута на сервере и возвращает его разметку.
 *
 * @param {object} props
 * @returns {Promise<JSX.Element|null>}
 */
async function CurrentComponent({query}) {
    // console.log(use, query); 
    // return <Component />;
    const Content = await query;
    return Content && <Content />;
}

CurrentComponent.propTypes = {
    query: PropTypes.any,
};

/**
 * Готовит серверный компонент маршрута к отрисовке через Suspense.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function CurrentRoute({
    component
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
