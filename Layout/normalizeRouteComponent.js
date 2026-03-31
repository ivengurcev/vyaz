function describeComponent(value) {
    if (value === null) {
        return 'null';
    }

    if (value === undefined) {
        return 'undefined';
    }

    if (typeof value === 'function') {
        return `function ${value.name || '(anonymous)'}`;
    }

    if (typeof value === 'object') {
        if (value?.default && typeof value.default === 'function') {
            return `module(default: ${value.default.name || '(anonymous)'})`;
        }

        if (value?.$$typeof) {
            return 'ReactElement';
        }

        return `object keys: ${Object.keys(value).join(', ') || '(empty)'}`;
    }

    return typeof value;
}

export default function normalizeRouteComponent(component) {
    const normalized = component?.default || component || null;

    if (normalized === null) {
        return null;
    }

    if (typeof normalized !== 'function') {
        throw new TypeError(
            `[router] Expected route component to be a React component function, got ${describeComponent(component)}`
        );
    }

    return normalized;
}
