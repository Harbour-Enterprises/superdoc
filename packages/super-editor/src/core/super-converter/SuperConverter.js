import xmljs from 'xml-js';
import { getNodeNumberingDefinition } from './numbering';
import { toKebabCase } from '@common/key-transform.js';

import { DocxExporter } from './exporter';
import { DocxImporter } from './importer';


class SuperConverter {

  static allowedElements = Object.freeze({
    'w:document': 'doc',
    'w:body': 'body',
    'w:p': 'paragraph',
    'w:r': 'run',
    'w:t': 'text',
    'w:br': 'pageBreak',
    // 'w:hyperlink': 'link',
    // 'w:tab': 'tab',

    // Formatting only
    'w:sectPr': 'sectionProperties',
    'w:rPr': 'runProperties',

    // Comments
    'w:commentRangeStart': 'commentRangeStart',
    'w:commentRangeEnd': 'commentRangeEnd',
    'w:commentReference': 'commentReference',

  });

  static markTypes = [
    { name: 'w:b', type: 'bold' },
    { name: 'w:bCs', type: 'bold' },
    { name: 'w:i', type: 'italic' },
    { name: 'w:iCs', type: 'italic' },
    { name: 'w:u', type: 'underline', mark: 'underline', property: 'underlineType' },
    { name: 'w:strike', type: 'strike' },
    { name: 'w:color', type: 'color', mark: 'textStyle', property: 'color' },
    { name: 'w:sz', type: 'fontSize', mark: 'textStyle', property: 'fontSize' },
    { name: 'w:szCs', type: 'fontSize', mark: 'textStyle', property: 'fontSize' },
    { name: 'w:rFonts', type: 'fontFamily', mark: 'textStyle', property: 'fontFamily' },
    { name: 'w:jc', type: 'textAlign', mark: 'textStyle', property: 'textAlign' },
    { name: 'w:ind', type: 'textIndent', mark: 'textStyle', property: 'textIndent' },
    { name: 'w:spacing', type: 'lineHeight', mark: 'textStyle', property: 'lineHeight' },
    { name: 'link', type: 'link', mark: 'link', property: 'href' },
  ]

  static propertyTypes = Object.freeze({
    'w:pPr': 'paragraphProperties',
    'w:rPr': 'runProperties',
    'w:sectPr': 'sectionProperties',
    'w:numPr': 'numberingProperties',
  });

  static elements = new Set([
    'w:document',
    'w:body',
    'w:p',
    'w:r',
    'w:t',
  ])

  constructor(params = null) {
    // Suppress logging when true
    this.debug = params?.debug || false;

    // The docx as a list of files
    this.convertedXml = {};
    this.docx = params?.docx || [];

    // XML inputs
    this.xml = params?.xml;
    this.declaration = null;

    // Processed additional content
    this.numbering = null;
    this.pageStyles = null;

    // The JSON converted XML before any processing. This is simply the result of xml2json
    this.initialJSON = null;

    // This is the JSON schema that we will be working with
    this.json = params?.json;

    this.tagsNotInSchema = ['w:body']
    this.savedTagsToRestore = [];

    // Parse the initial XML, if provided
    if (this.docx.length || this.xml) this.parseFromXml();
  }

  parseFromXml() {
    this.docx?.forEach(file => {
      this.convertedXml[file.name] = this.parseXmlToJson(file.content);
    });
    this.initialJSON = this.convertedXml['word/document.xml'];

    if (!this.initialJSON) this.initialJSON = this.parseXmlToJson(this.xml);
    this.declaration = this.initialJSON?.declaration;
  }

  parseXmlToJson(xml) {
    return JSON.parse(xmljs.xml2json(xml, null, 2))
  }
  
  getDocumentDefaultStyles() {
    const styles = this.convertedXml['word/styles.xml'];
    if (!styles) return {};

    const defaults = styles.elements[0].elements.find((el) => el.name === 'w:docDefaults');

    // TODO: Check if we need this
    // const pDefault = defaults.elements.find((el) => el.name === 'w:pPrDefault');

    // Get the run defaults for this document - this will include font, theme etc.
    const rDefault = defaults.elements.find((el) => el.name === 'w:rPrDefault');
    if ('elements' in rDefault) {
      const rElements = rDefault.elements[0].elements
      const fontThemeName = rElements.find((el) => el.name === 'w:rFonts')?.attributes['w:asciiTheme'];
      let typeface, panose;
      if (fontThemeName) {
        const fontInfo = this.getThemeInfo(fontThemeName);
        typeface = fontInfo.typeface;
        panose = fontInfo.panose;
      }

      const fontSizePt = Number(rElements.find((el) => el.name === 'w:sz')?.attributes['w:val']) / 2;
      const kern = rElements.find((el) => el.name === 'w:kern')?.attributes['w:val'];
      return { fontSizePt, kern, typeface, panose };
    }
  }

  getThemeInfo(themeName) {
    themeName = themeName.toLowerCase();
    const theme1 = this.convertedXml['word/theme/theme1.xml'];
    const themeData = theme1.elements.find((el) => el.name === 'a:theme');
    const themeElements = themeData.elements.find((el) => el.name === "a:themeElements");
    const fontScheme = themeElements.elements.find((el) => el.name === 'a:fontScheme');
    let fonts;

    if (themeName.startsWith('major')) {
      fonts = fontScheme.elements.find((el) => el.name === 'a:majorFont').elements[0];
    } else if (themeName.startsWith('minor')) {
      fonts = fontScheme.elements.find((el) => el.name === 'a:minorFont').elements[0];
    }

    const { typeface, panose } = fonts.attributes;
    return { typeface, panose };
  }

  getSchema() {
    const importer = new DocxImporter(this);
    return importer.getSchema();
  }

  schemaToXml(data) {
    const exporter = new DocxExporter(this);
    return exporter.schemaToXml(data);
  }

  exportToDocx(jsonData) {
    const exporter = new DocxExporter(this);
    const jsonOutput = exporter.outputToJson(jsonData);
    return exporter.schemaToXml(jsonOutput);
  }
}

SuperConverter.prototype.getNodeNumberingDefinition = getNodeNumberingDefinition;
export { SuperConverter }