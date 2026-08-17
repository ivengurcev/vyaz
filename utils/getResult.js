/**
 * Возвращает значение или результат его вычисления с переданными аргументами.
 * Аргументы-функции вычисляются перед вызовом основного callback.
 *
 * @param {*} value Значение или функция.
 * @param {...*} args Аргументы для функции.
 * @returns {*} Исходное значение или результат вызова функции.
 */
export default function getResult(value, ...args) {
    if(typeof value !== 'function') {
        return value;
    }

    return value(...args.map((arg) => typeof arg === 'function' ? arg() : arg));
}
