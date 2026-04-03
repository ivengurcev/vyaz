import resolvePath from './resolvePath.mjs';

export default function getStringRoutes(routes, isServer) {
    return '[\n' + routes
        .filter(({isServer: is}) => isServer || !is)
        .map(route => '{\n' 
            + Object.keys(route).reduce((result, key) => {
                switch (key) {
                    case 'component': 
                        result.push(`\t${key}: () => import('${resolvePath(route[key])}')`);
                        break;
                    case 'hasAccess': 
                    case 'getData': 
                        break;
                    default: 
                        result.push(`\t${key}: ${JSON.stringify(route[key])}`);
                    
                }
                return result;
            }, []).join(',\n')
            + '\n}')
        .join(',\n')
        + '\n]';
}
