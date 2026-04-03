const WORKSPACE_CONFIG = '@@config@@',
    CONFIG_FILTER = /^__config__$/,
    WORKSPACE = process.cwd();

export default function getConfigPlugin({
    API_ROOT,
    AUTH_URL,
    AUTH_SIGNIN,
    ASSET_PUBLIC_BASE,
    STATIC_PATH 
}) {
    return             {
        name: 'config-variables',
        setup(build) {
            build.onResolve({ filter: CONFIG_FILTER }, async ({path}) => {
                return {
                    path,
                    namespace: WORKSPACE_CONFIG
                }
            });
            build.onLoad({ filter: /.*$/, namespace: WORKSPACE_CONFIG }, async () => {
                const config = {
                        AUTH_BASE_URL: AUTH_URL,
                        API_BASE_URL: API_ROOT,
                        ASSET_PUBLIC_BASE_URL: ASSET_PUBLIC_BASE,
                        AUTH_SIGNIN,
                        STATIC_PATH
                    },
                    contents = `export const ${Object.keys(config).map(k => `${k} = ${JSON.stringify(config[k])}`).join(',\n\t')}`;
                // console.log(contents);
                return {
                    resolveDir: WORKSPACE,
                    loader: 'js',
                    contents
                }
            })
        }
    };
} 
