import xmljs from 'xml-js';

import { DocxExporter, exportSchemaToJson } from './exporter';
import { createDocumentJson } from './v2/importer/docxImporter.js';
import { getArrayBufferFromUrl } from './helpers.js';
import { baseNumbering } from './v2/exporter/helpers/base-list.definitions.js';

class SuperConverter {
  static allowedElements = Object.freeze({
    'w:document': 'doc',
    'w:body': 'body',
    'w:p': 'paragraph',
    'w:r': 'run',
    'w:t': 'text',
    'w:delText': 'text',
    'w:br': 'lineBreak',
    'w:tbl': 'table',
    'w:tr': 'tableRow',
    'w:tc': 'tableCell',
    'w:drawing': 'drawing',
    'w:bookmarkStart': 'bookmarkStart',
    // 'w:tab': 'tab',

    // Formatting only
    'w:sectPr': 'sectionProperties',
    'w:rPr': 'runProperties',

    // // Comments
    // 'w:commentRangeStart': 'commentRangeStart',
    // 'w:commentRangeEnd': 'commentRangeEnd',
    // 'w:commentReference': 'commentReference',
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
    { name: 'w:highlight', type: 'highlight', mark: 'highlight', property: 'color' },
  ];

  static propertyTypes = Object.freeze({
    'w:pPr': 'paragraphProperties',
    'w:rPr': 'runProperties',
    'w:sectPr': 'sectionProperties',
    'w:numPr': 'numberingProperties',
  });

  static elements = new Set(['w:document', 'w:body', 'w:p', 'w:r', 'w:t', 'w:delText']);

  constructor(params = null) {
    // Suppress logging when true
    this.debug = params?.debug || false;

    // Important docx pieces
    this.declaration = null;
    this.documentAttributes = null;

    // The docx as a list of files
    this.convertedXml = {};
    this.docx = params?.docx || [];
    this.media = params?.media || {};

    this.addedMedia = {};

    // XML inputs
    this.xml = params?.xml;
    this.declaration = null;

    // List defs
    this.numbering = {};

    // Processed additional content
    this.numbering = null;
    this.pageStyles = null;

    // The JSON converted XML before any processing. This is simply the result of xml2json
    this.initialJSON = null;

    // Headers and footers
    this.headers = {};
    this.headerIds = { default: null, even: null, odd: null, first: null };
    this.footers = {};
    this.footerIds = { default: null, even: null, odd: null, first: null };

    // This is the JSON schema that we will be working with
    this.json = params?.json;

    this.tagsNotInSchema = ['w:body'];
    this.savedTagsToRestore = [];

    // Parse the initial XML, if provided
    if (this.docx.length || this.xml) this.parseFromXml();
  }

  parseFromXml() {
    this.docx?.forEach((file) => {
      this.convertedXml[file.name] = this.parseXmlToJson(file.content);

      if (file.name === 'word/document.xml') {
        this.documentAttributes = this.convertedXml[file.name].elements[0]?.attributes;
      }
    });
    this.initialJSON = this.convertedXml['word/document.xml'];

    if (!this.initialJSON) this.initialJSON = this.parseXmlToJson(this.xml);
    this.declaration = this.initialJSON?.declaration;
  }

  parseXmlToJson(xml) {
    return JSON.parse(xmljs.xml2json(xml, null, 2));
  }

  getDocumentDefaultStyles() {
    const styles = this.convertedXml['word/styles.xml'];
    if (!styles) return {};

    const defaults = styles.elements[0].elements.find((el) => el.name === 'w:docDefaults');

    // const pDefault = defaults.elements.find((el) => el.name === 'w:pPrDefault');

    // Get the run defaults for this document - this will include font, theme etc.
    const rDefault = defaults.elements.find((el) => el.name === 'w:rPrDefault');
    const rElements = rDefault.elements[0].elements;
    const rFonts = rElements?.find((el) => el.name === 'w:rFonts');
    if ('elements' in rDefault) {
      const fontThemeName = rElements.find((el) => el.name === 'w:rFonts')?.attributes['w:asciiTheme'];
      let typeface, panose;
      if (fontThemeName) {
        const fontInfo = this.getThemeInfo(fontThemeName);
        typeface = fontInfo.typeface;
        panose = fontInfo.panose;
      } else if (rFonts) {
        typeface = rFonts?.attributes['w:ascii'];
      } else {
        const paragraphDefaults =
          styles.elements[0].elements.filter((el) => {
            return el.name === 'w:style' && el.attributes['w:styleId'] === 'Normal';
          }) || [];
        paragraphDefaults.forEach((el) => {
          const rPr = el.elements.find((el) => el.name === 'w:rPr');
          const fonts = rPr?.elements?.find((el) => el.name === 'w:rFonts');
          typeface = fonts?.attributes['w:ascii'];
        });
      }

      const fontSizePt = Number(rElements.find((el) => el.name === 'w:sz')?.attributes['w:val']) / 2 || 12;
      const kern = rElements.find((el) => el.name === 'w:kern')?.attributes['w:val'];
      return { fontSizePt, kern, typeface, panose };
    }
  }

  getThemeInfo(themeName) {
    themeName = themeName.toLowerCase();
    const theme1 = this.convertedXml['word/theme/theme1.xml'];
    const themeData = theme1.elements.find((el) => el.name === 'a:theme');
    const themeElements = themeData.elements.find((el) => el.name === 'a:themeElements');
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
    const result = createDocumentJson({...this.convertedXml, media: this.media }, this );
    if (result) {
      this.savedTagsToRestore.push({ ...result.savedTagsToRestore });
      this.pageStyles = result.pageStyles;
      this.numbering = result.numbering;
      return result.pmDoc;
    } else {
      return null;
    }
  }

  schemaToXml(data) {
    const exporter = new DocxExporter(this);
    return exporter.schemaToXml(data);
  }

  exportToXmlJson({ data, editor, isFinalDoc = false }) {
    const bodyNode = this.savedTagsToRestore.find((el) => el.name === 'w:body');
    const documentMedia = editor.storage.image.media;
    const editorSchema = editor.schema;
    const [result, params] = exportSchemaToJson({
      node: data,
      bodyNode,
      relationships: [],
      documentMedia: {},
      media: {},
      isFinalDoc,
      editorSchema,
      pageStyles: this.pageStyles,
      editor,
      generatedNumberingDefs: {
        abstractNums: [],
        numDefs: [],
      }
    });
    return { result, params };
  }
  
  async exportToDocx({ data, editor, isFinalDoc = false }) {
    const { result, params } = this.exportToXmlJson({ data, editor, isFinalDoc });
    const exporter = new DocxExporter(this);
    const xml = exporter.schemaToXml(result);

    // Update media
    await this.#exportProcessMediaFiles({
      ...documentMedia,
      ...params.media,
      ...this.media,
    });

    // Update the rels table
    this.#exportProcessNewRelationships(params.relationships);

    // Update the numbering.xml
    this.#exportNumberingFile(params.generatedNumberingDefs);

    return xml;
  };

  #exportNumberingFile({ abstractNums = [], numDefs = [] }) {
    const numberingPath = 'word/numbering.xml';
    let numberingXml = this.convertedXml[numberingPath];

    if (!numberingXml) numberingXml = baseNumbering;
    const numbering = numberingXml.elements[0];

    numbering.elements.push(...abstractNums);
    numbering.elements.push(...numDefs);

    // Update the numbering file
    this.convertedXml[numberingPath] = numberingXml;
  };

  #exportProcessNewRelationships(rels = []) {
    const relsData = this.convertedXml['word/_rels/document.xml.rels'];
    const relationships = relsData.elements.find((x) => x.name === 'Relationships');
    relationships.elements.push(...rels);
    relationships.elements.forEach((element) => {
      element.attributes.Target = element.attributes?.Target?.replace(/&/g, '&amp;').replace(/-/g, '&#45;');
    });
    this.convertedXml['word/_rels/document.xml.rels'] = relsData;
  };

  async #exportProcessMediaFiles(media) {
    const processedData = {};
    for (const filePath in media) {
      if (typeof media[filePath] !== 'string') return;
      const name = filePath.split('/').pop();
      processedData[name] = await getArrayBufferFromUrl(media[filePath]);
    }

    this.convertedXml.media = {
      ...this.convertedXml.media,
      ...processedData,
    };
    this.media = this.convertedXml.media;
    this.addedMedia = processedData;
  };
};

export { SuperConverter };
