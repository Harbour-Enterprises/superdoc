import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from './helpers';
import { SuperConverter } from '../../SuperConverter';
import source1 from './output-tests-source';

const showParserLogging = false;

export function runOutputTests(fileName) {
  describe(`Test runs ${fileName}`, () => {

    it('works', () => {
      expect(true).toBe(true);
    });

  });
};

export function testOutputConversion() {

  beforeEach(() => {

  });

  describe('Granular tests for known output', () => {

    it('can generate initial xml tag from declaration and empty document', () => {
      const c = new SuperConverter();
      c.declaration = {
        attributes: {
          "version": "1.0",
          "encoding": "UTF-8",
          "standalone": "yes"
        }
      };

      const schema = {
        doc: {
          "type": "doc",
          "content": [],
          "attrs": {
            "type": "element",
            "attributes": {}
          }
        }
      }
      const xml = c._generate_xml_as_list(schema);
      let expected = [`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`, `<w:document>`,`</w:document>`];
      expect(xml).toEqual(expected);
    });

    it('can generate xml recursively', () => {
      const c = new SuperConverter();
      c.declaration = {
        attributes: {
          "version": "1.0",
          "encoding": "UTF-8",
          "standalone": "yes"
        }
      };

      const schema = { doc: source1 }
      const xml = c._generate_xml_as_list(schema);

      // console.debug(xml);
      expect(xml).toBeInstanceOf(Array);

      // Check paragraph and attrs. The expected result is pulled from the original (or expected) XML.
      expect(xml[3]).toEqual('<w:p w14:paraId="44621174" w14:textId="6D5C378D" w:rsidR="003C58BC" w:rsidRDefault="00746728">');
      expect(xml[5]).toEqual('<w:t xml:space="preserve">');
      expect(xml[xml.length - 6]).toEqual('<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>');
      expect(xml[xml.length - 4]).toEqual('<w:docGrid w:linePitch="360"/>');

      // Test that text loads correctly
      expect(xml[6]).toEqual('This is a basic docx document with ');
    });

  });
}