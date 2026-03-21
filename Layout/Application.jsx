import PropTypes from 'prop-types';

/**
 * Возвращает дочерний контент без дополнительной обёртки.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
export default function Application({children}) {
    return children;
}

Application.propTypes = {
    children: PropTypes.node,
};
