import {sassPlugin, postcssModules} from 'esbuild-sass-plugin';
import autoprefixer from 'autoprefixer';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url),
    __dirname = dirname(__filename);
export default function cssModulesPlugin() {
    return sassPlugin({
        filter: /\.module\.(s[ac]ss|css)$/,
        transform: postcssModules({
            basedir: dirname(__dirname),
            generateScopedName: '[name]__[local]___[hash:base64:5]',
        }, [autoprefixer]),
    });
}