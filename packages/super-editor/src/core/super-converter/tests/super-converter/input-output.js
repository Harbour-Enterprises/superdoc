import { describe, it, expect, beforeEach } from 'vitest';
import { SuperConverter } from '../../SuperConverter.js';
import { Editor } from '../../../Editor.js';
import * as extensions from '@extensions/index.js';

export function runInputOutputTests() {

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * This test uses a known XML input, uses Editor.js to parse the Schema, and then uses
   * Editor.js' exportDocx method to convert the schema back to a docx document. 
   */
  describe('Editor.js and SuperConverter input/output conversion', async () => {
    it('exports the expected output after importing xml, passing through the ProseMirror Schema and exported again', async () => {
      const input = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex">
          <w:body>
            <w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">
              <w:r>
                <w:t xml:space="preserve">This is a basic docx document with </w:t>
              </w:r>
            </w:p>
            <w:sectPr w:rsidR="00746728">
              <w:pgSz w:w="12240" w:h="15840" />
              <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0" />
              <w:cols w:space="720" />
              <w:docGrid w:linePitch="360" />
            </w:sectPr>
          </w:body>
        </w:document>
      `

      const converter = new SuperConverter({ xml: input, debug: true });

      // Declaration check
      const expectedDeclaration = { attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'yes' } };
      expect(converter.declaration).toEqual(expectedDeclaration);

      const initialJSON = { ...converter.initialJSON };
      const containerDiv = document.createElement('div');
      const schema = converter.getSchema();
      const editor = new Editor({
          element: containerDiv,
          content: schema,
          extensions: Object.values(extensions),
          isTest: true,
          converter,
        }
      );

      // Delay to wait for the editor to be ready
      await delay(250);
      const doc = editor.getJSON();
      const output = converter.outputToJson(doc);
      expect(initialJSON.declaration).toEqual(output.declaration);

      // Check the doc element. Names and attributes should match.
      const inputDocElement = initialJSON.elements[0];
      const outputDocElement = output.elements[0];
      expect(inputDocElement.name).toEqual(outputDocElement.name);
      expect(inputDocElement.attributes).toEqual(outputDocElement.attributes);
      expect(inputDocElement.elements.length).toEqual(outputDocElement.elements.length);

      // Check the body element. Names and attributes should match.
      // Elements length should match
      const inputBody = inputDocElement.elements[0];
      const outputBody = outputDocElement.elements[0];
      expect(inputBody.name).toEqual(outputBody.name);
      expect(inputBody.attributes).toEqual(outputBody.attributes); 
      expect(inputBody.elements.length).toEqual(outputBody.elements.length);

      const inputBodyElements = inputBody.elements;
      const outputBodyElements = outputBody.elements;
      
      // Check the first element in the result. Expects to find the original paragraph.
      expect(inputBodyElements[0].name).toEqual('w:p');
      expect(inputBodyElements[0].name).toEqual(outputBodyElements[0].name);
      expect(inputBodyElements[0].attributes).toEqual(outputBodyElements[0].attributes);
      expect(inputBodyElements[0].elements.length).toEqual(outputBodyElements[0].elements.length);

      // The second element expects to find the sectPr
      expect(inputBodyElements[1].name).toEqual('w:sectPr');
      expect(inputBodyElements[1].name).toEqual(outputBodyElements[1].name);
      expect(inputBodyElements[1].attributes).toEqual(outputBodyElements[1].attributes);
      expect(inputBodyElements[1].elements.length).toEqual(outputBodyElements[1].elements.length);

      // Does the entire input JSON equal the entire output JSON?
      expect(initialJSON).toEqual(output);

      // Does the original XML equal the exported XML?
      const XML = converter.schemaToXml(output);
      expect(XML).toEqual(removeExcessWhitespace(input));
    });

  });

  describe('Editor.js and SuperConverter input/output conversion with marks', async () => {
    it('can import/output the expected xml with marks', async () => {
      const input = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex">
          <w:body>
            <w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">
              <w:r>
                <w:t xml:space="preserve">This is a basic docx document with </w:t>
              </w:r>
              <w:r w:rsidRPr="00746728">
                <w:rPr>
                  <w:b />
                  <w:bCs />
                </w:rPr>
                <w:t>bold</w:t>
              </w:r>
            </w:p>
            <w:sectPr w:rsidR="00746728">
              <w:pgSz w:w="12240" w:h="15840" />
              <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0" />
              <w:cols w:space="720" />
              <w:docGrid w:linePitch="360" />
            </w:sectPr>
          </w:body>
        </w:document>
      `

      const converter = new SuperConverter({ xml: input, debug: true });

      // Declaration check
      const expectedDeclaration = { attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'yes' } };
      expect(converter.declaration).toEqual(expectedDeclaration);

      const initialJSON = { ...converter.initialJSON };
      const containerDiv = document.createElement('div');
      const schema = converter.getSchema();
      const editor = new Editor({
          element: containerDiv,
          content: schema,
          extensions: Object.values(extensions),
          isTest: true,
          converter,
      });

      // Delay to wait for the editor to be ready
      await delay(250);
      const doc = editor.getJSON();
      const output = converter.outputToJson(doc);
      const inputDocElement = initialJSON.elements[0];
      const outputDocElement = output.elements[0];

      // 
      const inputBody = inputDocElement.elements[0];
      const outputBody = outputDocElement.elements[0];
      const inputParagraph = inputBody.elements[0];
      const outputParagraph = outputBody.elements[0];

      // Check the bold element
      const inputBoldRun = inputParagraph.elements[1];
      const outputBoldRun = outputParagraph.elements[1];

      expect(inputBoldRun.name).toEqual(outputBoldRun.name);
      expect(inputBoldRun.attributes).toEqual(outputBoldRun.attributes);
      expect(inputBoldRun.elements.length).toEqual(outputBoldRun.elements.length);
      expect(inputBoldRun).toEqual(outputBoldRun);

      // Does the entire input JSON equal the entire output JSON?
      expect(initialJSON).toEqual(output);

      // Does the original XML equal the exported XML?
      const XML = converter.schemaToXml(output);
      console.debug('XML', XML);
      expect(XML).toEqual(removeExcessWhitespace(input));
    });

  });
};

/**
 * Used to remove excess whitespace around the test XML strings
 * 
 * @param {string} xmlString 
 * @returns 
 */
function removeExcessWhitespace(xmlString) {
  xmlString = xmlString.trim();
  xmlString = xmlString.replace(/>\s+</g, '><');
  return xmlString;
}