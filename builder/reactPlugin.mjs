import { createRequire } from 'node:module';
import {dirname, join} from 'node:path';
import { fileURLToPath } from 'url';

const require = createRequire(new URL('../package.json', import.meta.url)),
    __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);


export default function reactPlugin() {
    return {
        name: 'react-fake',
        setup(build) {
            build.onResolve({ filter: /^__realreact$/ }, () => {
                return {
                    path: require.resolve('react')
                }                
            });
            build.onResolve({ filter: /^react$/ }, props => {
                
                if(!/\.yarn\/cache/.test(props.importer)) {
                    // console.log('react', props);
                    return {
                        // namespace: 'faked-react',
                        path: join(__dirname, 'fakeReact.js')
                    }
                }

                // ({ path: props.path, namespace: dirname(props.importer)})
            });
            // build.onLoad({filter: /.*/, namespace: 'faked-react'}, async ({path, importer}) => {
            //     console.log('react!!!!', path, importer);
            //     return {
            //         resolveDir: dirname(require.resolve('react')),
            //         contents: reactFakeContents
            //     }
            // })
        }
    }
}
