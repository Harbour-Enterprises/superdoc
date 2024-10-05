/**
 *
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export const carbonCopy = (obj) => {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error('Error in carbonCopy', obj, e);
        return undefined;
    }
}