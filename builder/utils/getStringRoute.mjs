import resolvePath from './resolvePath.mjs';

export default function getStringRoutes(routes, isServerBuild) {
    return '[\n' + routes
        .map(route => '{\n' 
            + Object.keys(route).reduce((result, key) => {
                switch (key) {
                    case 'component': 
                        if(!isServerBuild || !route.disableSSR) {
                            result.push(`\t${key}: () => import('${resolvePath(route[key])}')`);
                        }
                        break;
                    case 'isServer':
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
