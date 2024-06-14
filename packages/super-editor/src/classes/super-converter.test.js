import path from 'path';
import fs from 'fs';
import { describe, it, expect } from 'vitest';
import SuperConverter from './super-converter';

// Helpers to read files
const readFileSync = (pathName) => fs.readFileSync(path.resolve(__dirname, pathName), 'utf-8');
const getSchemaPath = (fileName) => `../tests/fixtures/${fileName}/${fileName}.schema.json`;

// Available test files
const testFiles = [
  'sample',
  'fake-contract'
];

// Run tests for each of our test files
const showParserLogging = false;
testFiles.forEach((fileName) => {

  // Run input tests (ie: from docx XML to SCHEMA)
  runInputTests(fileName);

  // Run output tests (ie: from SCHEMA to docx XML)
  // TODO
});

function runInputTests(fileName) {
  describe(`XML to SCHEMA tests: ${fileName}`, () => {
    let parser;
    let currentTestFile = fileName;
    let currentXML;

    beforeEach(() => {
      const pathName = `../tests/fixtures/${currentTestFile}/${currentTestFile}/word/document.xml`;
      currentXML = readFileSync(pathName);
      parser = new SuperConverter({ xml: currentXML, debug: showParserLogging });
    });

    it('can create instance with XML', () => {
      expect(parser).toBeTruthy();
      expect(parser).toBeInstanceOf(SuperConverter);
      
      // When we initialize the instance with XML, it is automatically parsed into initialJSON
      expect(parser.xml).toBe(currentXML);
      expect(parser.initialJSON).not.toBeNull();
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
    })
  });
}