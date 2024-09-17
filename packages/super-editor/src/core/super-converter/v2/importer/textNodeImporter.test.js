import {SuperConverter} from "../../SuperConverter.js";
import {handleTextNode} from "./textNodeImporter.js";
import {createNodeListHandlerMock} from "./test-helpers/testUtils.test.js";

describe('TextNodeImporter', () => {
    it("parses only text nodes", () => {
        const names = Object.keys(SuperConverter.allowedElements).filter((name) => name !== 'w:t');
        const nodesOfNodes = names.map((name) => ([{name}]));
        for(const nodes of nodesOfNodes) {
            const result = handleTextNode(nodes, null, null, false);
            expect(result.length).toBe(0);
        }
    });

    it("parses text nodes with xml:space attribute", () => {
        const nodes = [{name: 'w:t', attributes: {'xml:space': 'preserve'}, elements: []}];
        const result = handleTextNode(nodes, null, createNodeListHandlerMock(), false);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('text');
        expect(result[0].text).toBe(" ");
    });

    it("parses text nodes", () => {
        const nodes = [{name: 'w:t', attributes: {}, elements: [{text: "This is a test text!"}]}];
        const result = handleTextNode(nodes, null, createNodeListHandlerMock(), false);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('text');
        expect(result[0].text).toBe("This is a test text!");
    });
});