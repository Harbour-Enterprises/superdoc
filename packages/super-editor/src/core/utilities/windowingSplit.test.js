// Define test function for readability

import {windowingSplit} from "./windowingSplit.js";

const matcher = (x) => x % 2 === 0;
const eq = (a, b) => a === b;

const testCases = [
    {
        input: [1, 1, 2, 2, 4, 4],
        expected: [{ matched: false, list: [1, 1] }, { matched: true, list: [2, 2] }, { matched: true, list: [4, 4] }],
    },
    {
        input: [2, 1, 2],
        expected: [{ matched: true, list: [2, 1, 2] }],
    },
    {
        input: [2, 1, 4],
        expected: [{ matched: true, list: [2] }, { matched: false, list: [1] }, { matched: true, list: [4] }],
    },
    {
        input: [2, 1],
        expected: [{ matched: true, list: [2] }, { matched: false, list: [1] }],
    },
    {
        input: [],
        expected: [],
    },
    {
        input: [4, 4, 4, 5],
        expected: [{ matched: true, list: [4, 4, 4] }, { matched: false, list: [5] }],
    },
    {
        input: [1, 3, 5, 7],
        expected: [{ matched: false, list: [1, 3, 5, 7] }],
    },
    {
        input: [2, 2, 3, 2],
        expected: [{ matched: true, list: [2, 2, 3, 2] }],
    },
];

describe("windowingSplit", () => {
    testCases.forEach(({ input, expected }, index) => {
        it(`input: ${JSON.stringify(input)}`, () => {
            const result = windowingSplit(input, matcher, eq);
            expect(result).toEqual(expected);
        });
    });
});
