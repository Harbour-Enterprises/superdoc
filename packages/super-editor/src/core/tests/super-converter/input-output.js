import path from 'path';
import fs from 'fs';

import { describe, it, expect, beforeEach } from 'vitest';
import { SuperConverter } from '../../SuperConverter';
import DocxZipper from '../../DocxZipper';
import { Editor } from '../../Editor.js';
import * as extensions from '@extensions/index.js';

export function runInputOutputTests() {

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe('Input/Output tests', async () => {

    it('can parse the correct declaration', async () => {
      const input = `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document 
          xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
          xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex">
          <w:body>
            <w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">
              <w:r>
                <w:t xml:space="preserve">This is a basic docx document with </w:t>
              </w:r>
            </w:p>
            <w:sectPr w:rsidR="00746728">
              <w:pgSz w:w="12240" w:h="15840" />
              <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720"
                w:footer="720" w:gutter="0" />
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
      const output = editor.exportDocx();
      expect(initialJSON.declaration).toEqual(output.declaration);

      // Check the doc element. Names and attributes should match.
      const inputDocElement = initialJSON.elements[0];
      const outputDocElement = output.elements[0];
      expect(inputDocElement.name).toEqual(outputDocElement.name);
      expect(inputDocElement.attributes).toEqual(outputDocElement.attributes);
      expect(inputDocElement.elements.length).toEqual(outputDocElement.elements.length);

      // Check the body element. Names and attributes should match.
      const inputBody = inputDocElement.elements[0];
      const outputBody = outputDocElement.elements[0];
      expect(inputBody.name).toEqual(outputBody.name);
      expect(inputBody.attributes).toEqual(outputBody.attributes);
  
    });

  });
};
