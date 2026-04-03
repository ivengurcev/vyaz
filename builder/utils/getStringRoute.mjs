import resolvePath from './resolvePath.mjs';

export default function getStringRoutes(routes, isServer) {
    return '[\n' + routes
        .filter(({isServer: is}) => isServer || !is)
        .map(route => '{\n' 
            + Object.keys(route).map(key => {
                switch (key) {
                    case 'component': {
                        return `\t${key}: () => import('${resolvePath(route[key])}')`;
                    } default: {
                        return `\t${key}: ${JSON.stringify(route[key])}`;
                    }
                }
            }).join(',\n')
            + '\n}')
        .join(',\n')
        + '\n]';
}