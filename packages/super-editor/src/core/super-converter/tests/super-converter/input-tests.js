import path from 'path';
import fs from 'fs';

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from './helpers';
import { SuperConverter } from '../../SuperConverter';
import DocxZipper from '../../../DocxZipper';

const showParserLogging = false;

export function runInputTests(fileName) {
  describe(`XML to SCHEMA tests: ${fileName}`, () => {
    let parser;
    let currentTestFile = fileName;
    let currentXML;

    beforeEach(() => {
      const pathName = `../../../tests/fixtures/${currentTestFile}/${currentTestFile}/word/document.xml`;
      currentXML = readFileSync(pathName);
      parser = new SuperConverter({ xml: currentXML, debug: showParserLogging });
    });


    it('can create instance with XML', () => {
      expect(parser).toBeTruthy();
      expect(parser).toBeInstanceOf(SuperConverter);

      // When we initialize the instance with XML, it is automatically parsed into initialJSON
      expect(parser.xml).toBe(currentXML);
      expect(parser.initialJSON).not.toBeNull();

      const schema = parser.getSchema();
    });


    it('can parse docx XML into SCHEMA', () => {
      expect(parser).toBeTruthy();
      expect(parser).toBeInstanceOf(SuperConverter);

      const schema = parser.getSchema();
      expect(schema).toBeTruthy();
      
      // The schema begins with some expected properties
      expect(schema).toHaveProperty('content');
      expect(schema).toHaveProperty('type');
      expect(schema).toHaveProperty('attrs');
      expect(schema.type).toBe('doc');
    });


    it('correctly parses the docx body', () => {
      const schema = parser.getSchema();
      expect(schema.content).toHaveLength(1);

      const body = schema.content[0];
      expect(body.type).toBe('body');
      expect(body).toHaveProperty('content');
      expect(body).toHaveProperty('attrs');

      const attrs = body.attrs;
      expect(attrs).toHaveProperty('type');
      expect(attrs.type).toBe('element');
      expect(attrs).toHaveProperty('attributes');

      // Attributes are the main page details, which should always be present
      // This comes from the <w:sectPr> tag, which we place under the sectionProperties key
      const attributes = attrs.attributes.sectionProperties;
      expect(attributes).toHaveProperty('type');
      expect(attributes).toHaveProperty('elements');

      // The properties are inside teh elements array
      const properties = attributes.elements;
      expect(properties).toBeTruthy();
    });
  });
}

export function testLists() {
  async function readFileAsBuffer(filePath) {
    const resolvedPath = path.resolve(__dirname, filePath);
    return new Promise((resolve, reject) => {
      fs.readFile(resolvedPath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          // Convert file content to a Buffer
          const buffer = Buffer.from(data);
          resolve(buffer);
        }
      });
    });
  }

  describe('List parsing tests', () => {

    it('works', async () => {

      const zip = new DocxZipper();
      const pathName = `../../../tests/fixtures/list1/list1.docx`;
      const fileContent = await readFileAsBuffer(pathName);
      const fileObject = Buffer.from(fileContent);
      const docx = await zip.getDocxData(fileObject);

      const c = new SuperConverter({ docx, debug: true });
      const initialJSON = c.initialJSON;
      const schema = c.getSchema();

      expect(schema).toBeTruthy();
      
      const initialParent = initialJSON.elements[0].elements[0]
      const parent = schema.content[0];
      
      const test = c.convertToSchema(initialParent)

      // console.debug('LIST1', JSON.stringify(test, null, 2));
      
    });
  });
}

export function testInputConversion() {
  describe('Granular tests from known input', () => {

    let xml;


    beforeEach(() => {
      xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    });


    it('can parse document tag', () => {
      xml += '<w:document xmlns:cx1="fake-ck1"></w:document>';

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();
      const expectedResult = {
        type: 'doc',
        content: [],
        attrs: { type: 'element', attributes: { 'xmlns:cx1': 'fake-ck1' } },
        marks: [],
      };
      expect(schema).toBeTruthy();
      expect(schema).toEqual(expectedResult);
    });


    it('can parse empty body tag', () => {
      xml += '<w:document>';
      xml += `<w:body></w:body>`;
      xml += '</w:document>';

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();
      let expected;

      const outputBody = schema.content[0];
      expect(outputBody.type).toBe('body');
      expect(outputBody).toHaveProperty('attrs');
      expect(outputBody.attrs).toHaveProperty('attributes');
      
      const outputAttributes = outputBody.attrs.attributes;
      expect(outputAttributes).not.toHaveProperty('sectionProperties');
    });


    it('can parse body tag with section properties', () => {
      xml += '<w:document>';
      xml += `
        <w:body>
          <w:sectPr w:rsidR="00746728">
            <w:pgSz w:w="12240" w:h="15840"/>
          </w:sectPr>
        </w:body>
      `;
      xml += '</w:document>';

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();
      let expected;

      const outputBody = schema.content[0];
      expect(outputBody.type).toBe('body');
      expect(outputBody).toHaveProperty('attrs');
      expect(outputBody.attrs).toHaveProperty('attributes');

      const outputAttributes = outputBody.attrs.attributes;
      expect(outputAttributes).toHaveProperty('sectionProperties');
      expect(outputAttributes.sectionProperties).toHaveProperty('type');
      expect(outputAttributes.sectionProperties.name).toBe('w:sectPr');
      expect(outputAttributes.sectionProperties).toHaveProperty('elements');

      const sectionProperties = outputAttributes.sectionProperties;
      expected = { type: 'element', name: 'w:pgSz', attributes: { 'w:w': '12240', 'w:h': '15840' } }
      expect(sectionProperties.elements[0]).toEqual(expected);
    });


    it('can parse body tag with paragraphs', () => {
      xml += '<w:document>';
      xml += `
        <w:body>
          <w:p w14:paraId="755418E4" w14:textId="77777777" w:rsidR="00746728" w:rsidRDefault="00746728"/>
          <w:p w14:paraId="1026E62B" w14:textId="3F58C8E7" w:rsidR="00746728" w:rsidRDefault="00746728">
            <w:r>
              <w:t>Here is a new paragraph.</w:t>
            </w:r>
          </w:p>
          <w:sectPr w:rsidR="00746728">
            <w:pgSz w:w="12240" w:h="15840"/>
          </w:sectPr>
        </w:body>
      `;
      xml += '</w:document>';

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();
      let expected;

      // Check that we have the expected paragraphs in the body
      const bodyElements = schema.content[0].content;
      expect(bodyElements).toHaveLength(2);
      expect(bodyElements[0].type).toBe('paragraph');
      expect(bodyElements[1].type).toBe('paragraph');

      // Check that paragraphs correctly get their attributes
      const p1 = bodyElements[0];
      expect(p1.attrs).toHaveProperty('attributes');
      expected = {
        'w14:paraId': '755418E4',
        'w14:textId': '77777777',
        'w:rsidR': '00746728',
        'w:rsidRDefault': '00746728'
      };
      expect(p1.attrs.attributes).toEqual(expected);
    });


    it('can parse paragraphs and their runs', () => {
      xml += '<w:document>';
      xml += `
        <w:body>
        	<w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">
            <w:r>
              <w:t xml:space="preserve">This is a basic docx document with </w:t>
            </w:r>
            <w:r w:rsidRPr="00746728">
              <w:rPr>
                <w:b/>
                <w:bCs/>
              </w:rPr>
              <w:t>bold</w:t>
            </w:r>
            <w:r>
              <w:t xml:space="preserve"> and </w:t>
            </w:r>
            <w:r w:rsidRPr="00746728">
              <w:rPr>
                <w:i/>
                <w:iCs/>
              </w:rPr>
              <w:t>italics</w:t>
            </w:r>
            <w:r>
              <w:t xml:space="preserve">. </w:t>
            </w:r>
          </w:p>
          <w:p w14:paraId="755418E4" w14:textId="77777777" w:rsidR="00746728" w:rsidRDefault="00746728"/>
          <w:p w14:paraId="1026E62B" w14:textId="3F58C8E7" w:rsidR="00746728" w:rsidRDefault="00746728">
            <w:r>
              <w:t>Here is a new paragraph.</w:t>
            </w:r>
          </w:p>
          <w:sectPr w:rsidR="00746728">
            <w:pgSz w:w="12240" w:h="15840"/>
          </w:sectPr>
        </w:body>
      `;
      xml += '</w:document>';

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();
      let expected;

      // Here we check against the third paragraph first
      const bodyElements = schema.content[0].content;
      const p3 = bodyElements[2];
      expect(p3).toHaveProperty('content');
      expect(p3.content).toHaveLength(1);

      const run = p3.content[0];
      expect(run.type).toBe('run');
      expect(run).toHaveProperty('content');

      const textItem = run.content[0];
      expect(textItem).toHaveProperty('text');
      expect(textItem.text).toBe('Here is a new paragraph.');

      // Now we check against the first paragraph
      const p1 = bodyElements[0];
      expect(p1).toHaveProperty('content');
      expect(p1.content).toHaveLength(5);

      // Check the middle, empty paragraph
      const p2 = bodyElements[1];
      expect(p2).toHaveProperty('content');
      expect(p2.content).toHaveLength(0);
    });


    it('can parse runs and their attrs', () => {
      xml += `
        <w:document>
          <w:body>
            <w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">
              <w:r>
                <w:t xml:space="preserve">This is a basic docx document with </w:t>
              </w:r>
              <w:r w:rsidRPr="00746728">
                <w:rPr>
                  <w:b/>
                  <w:bCs/>
                </w:rPr>
                <w:t>bold</w:t>
              </w:r>
              <w:r>
                <w:t xml:space="preserve"> and </w:t>
              </w:r>
              <w:r w:rsidRPr="00746728">
                <w:rPr>
                  <w:i/>
                  <w:iCs/>
                </w:rPr>
                <w:t>italics</w:t>
              </w:r>
              <w:r>
                <w:t xml:space="preserve">. </w:t>
              </w:r>
            </w:p>
            <w:sectPr w:rsidR="00746728">
              <w:pgSz w:w="12240" w:h="15840"/>
              <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
              <w:cols w:space="720"/>
              <w:docGrid w:linePitch="360"/>
            </w:sectPr>
          </w:body>
        </w:document>
      `;

      const c = new SuperConverter({ xml });
      const schema = c.getSchema();

      // Here we check against the third paragraph first
      const bodyElements = schema.content[0].content;
      const runs = bodyElements[0].content;

      // Check the xml:space attr in the first run
      const run1 = runs[0]
      expect(run1).toHaveProperty('content');
      expect(run1).toHaveProperty('attrs')

      // Check the text item
      const text1 = run1.content[0];
      expect(text1.attrs).toHaveProperty('attributes');
      expect(text1.attrs.attributes).toHaveProperty('xml:space');
      
      // Check run #2
      const run2 = runs[1];
      expect(run2).toHaveProperty('attrs');
      expect(run2.attrs).toHaveProperty('attributes');
      expect(run2.attrs.attributes).toHaveProperty('w:rsidRPr');
      expect(run2.attrs.attributes['w:rsidRPr']).toBe('00746728');

      // Check run 2 run properties
      const run2Pr = run2.attrs.attributes.runProperties;
      expect(run2Pr).toHaveProperty('type');
      expect(run2Pr.name).toBe('w:rPr');
      expect(run2Pr.elements).toHaveLength(2);
      
      const runProps = run2Pr.elements;
      expect(runProps[0].name).toBe('w:b');
      expect(runProps[1].name).toBe('w:bCs');

    });


    it('can parse list items', () => {

      // TODO

    });
  });


  // Tests with sample.docx for basic marks
  // TODO: Re-add these tests

  // describe(`Marks tests`, () => {

  //   let c;
  //   beforeEach(() => {
  //     c = new SuperConverter({ debug: true });
  //   });

  //   const getSchema = (pathName) => {
  //     const initialJSON = JSON.parse(readFileSync(pathName));
  //     c.initialJSON = initialJSON;
  //     return c.getSchema();
  //   }

  //   it('can parse bold mark', () => {
  //     const pathName = `../../../tests/fixtures/sample.docx`;
  //     const schema = getSchema(pathName)
  //     const body = schema.content[0];
  //     const p1 = body.content[0];
  //     const run = p1.content[1];
  //     const marks = run.marks;

  //     expect(marks).toHaveLength(1);
  //     expect(marks[0].type).toBe('bold');
  //   });

  //   it('can parse em mark', () => {
  //     const pathName = `../../../tests/fixtures/sample/initial-json.json`;
  //     const schema = getSchema(pathName)
  //     const body = schema.content[0];
  //     const p1 = body.content[0];
  //     const run = p1.content[3];
  //     const marks = run.marks;

  //     expect(marks).toHaveLength(1);
  //     expect(marks[0].type).toBe('em');
  //   });

  //   it('can parse em and bold together', () => {
  //     const pathName = `../../../sample/initial-json.json`;
  //     const schema = getSchema(pathName)
  //     const body = schema.content[0];
  //     const p3 = body.content[2];
  //     const run = p3.content[3];
  //     const marks = run.marks;

  //     expect(marks).toHaveLength(2);
  //     expect(marks[0].type).toBe('bold');
  //     expect(marks[1].type).toBe('em');
  //   });

  // });
}
