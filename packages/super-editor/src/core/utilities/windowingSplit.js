/**
 * @template T
 * @typedef {{matched: boolean, list: T[]}} Chunk
 */

/**
 * Splits an array into chunks where each chunk contains a list of elements
 * grouped based on whether they are "interesting" (according to the matcher) and
 * whether the interesting elements are compatible (according to the eq comparator).
 *
 * @template T
 * @param {T[]} array - The input array of elements to be split.
 * @param {(item: T) => boolean} matcher - A function to determine if an element is "interesting".
 * @param {(a: T, b: T) => boolean} eq - A function to compare two "interesting" elements for compatibility.
 * @returns {Chunk<T>[]} - The array of chunks where each chunk has a `matched` flag and a `list`.
 */
export function windowingSplit(array, matcher, eq) {
    const result = [];
    let currentChunk = { matched: false, list: [] };

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const isInteresting = matcher(item);

        if (isInteresting) {
            if(!currentChunk.matched){
                if(currentChunk.list.length > 0){
                    result.push(currentChunk);
                }
                currentChunk = { matched: true, list: [item] };
            } else if (currentChunk.matched && currentChunk.list.length > 0 && !eq(currentChunk.list[0], item)) {
                result.push(...splitChunk(currentChunk, matcher))
                currentChunk = { matched: true, list: [item] };
            } else {
                // If the current chunk is interesting and this item is interesting and compatible, add to the current chunk
                currentChunk.list.push(item);
            }
        } else {
            currentChunk.list.push(item);
        }
    }

    // Push the last chunk if it has elements
    if (currentChunk.list.length > 0) {
        result.push(...splitChunk(currentChunk, matcher))
    }

    return result;
}

/**
 * Splits a chunk into two parts based on the matcher.
 * @template T
 * @param {Chunk<T>} chunk
 * @param {(element: T) => boolean} matcher
 * @returns {Chunk<T>[]}
 * It may inplace modify the input chunk.
 */
const splitChunk = (chunk, matcher) => {
    if(chunk.matched === false) {
        return [chunk];
    }
    const result = [];
    // find the last matching index in the current chunk
    let lastMatchingIndex = 0;
    for (let j = chunk.list.length - 1; j >= 0; j--) {
        if (matcher(chunk.list[j])) {
            lastMatchingIndex = j;
            break;
        }
    }
    // split the current chunk list into two parts
    const firstPart = chunk.list.slice(0, lastMatchingIndex + 1)
    const secondPart = chunk.list.slice(lastMatchingIndex + 1)

    chunk.list = firstPart
    result.push(chunk)
    if(secondPart.length > 0) {
        chunk = { matched: false, list: secondPart }
        result.push(chunk)
    }

    chunk = {matched: false, list: []}
    return result;
}
