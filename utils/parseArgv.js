/**
 * Выбирает из argv поддерживаемые флаги и их значения.
 *
 * @param {string[]} argv Аргументы командной строки.
 * @param {string[]} keys Поддерживаемые ключи.
 * @returns {Record<string, boolean|string>} Найденные аргументы.
 */
export default function parseArgv(argv, keys) {
    return argv.reduce((result, arg) => {
        const key = keys.find((candidate) => arg.startsWith(candidate));

        if(key) {
            result[key] = arg === key ? true : arg.split('=')[1].trim();
        }

        return result;
    }, {});
}
