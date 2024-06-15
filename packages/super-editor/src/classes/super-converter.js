import xmljs from 'xml-js';


/**
 * Class to translate from DOCX XML to Prose Mirror Schema and back
 * 
 * Will need to be updated as we find new docx tags.
 * 
 */
class SuperConverter {

  static allowedElements = Object.freeze({
    'w:document': 'doc',
    'w:body': 'body',
    'w:p': 'paragraph',
    'w:r': 'run',
    'w:t': 'text',

    // Formatting only
    'w:sectPr': 'sectionProperties',
    'w:rPr': 'runProperties',

    // Comments
    'w:commentRangeStart': 'commentRangeStart',
    'w:commentRangeEnd': 'commentRangeEnd',
    'w:commentReference': 'commentReference',
  });

  static propertyTypes = Object.freeze({
    'w:pPr': 'paragraphProperties',
    'w:rPr': 'runProperties',
    'w:sectPr': 'sectionProperties',
  });


  constructor(params = null) {
    // Suppress logging when true
    this.debug = params?.debug || false;

    // XML inputs
    this.xml = params?.xml;
    this.declaration = null;

    // The JSON converted XML before any processing. This is simply the result of xml2json
    this.initialJSON = null;

    // This is the JSON schema that we will be working with
    this.json = params?.json;

    // Parse the initial XML, if provided
    this.log('Original XML:', this.xml)
    if (this.xml) this.parseFromXml();
  }

  log(...args) {
    if (this.debug) console.debug(...args);
  }

  getTagName(name) {
    const keys = Object.keys(SuperConverter.allowedElements)
    return keys.find(key => SuperConverter.allowedElements[key] === name);
  }

  parseFromXml() {
    const result = xmljs.xml2json(this.xml, null, 2);
    this.initialJSON = JSON.parse(result);
    this.declaration = this.initialJSON.declaration;
  }

  getElementName(element) {
    const name = element.name || element.type;
    return SuperConverter.allowedElements[name];
  }

  getSchema() {
    const json = JSON.parse(JSON.stringify(this.initialJSON));
    const startElements = json.elements;
    const result = this.convertToSchema(startElements[0]);

    // this.log('\nSchema updated:', JSON.stringify(result, null, 2))
    return result;
  }


  /** 
   * convertToJson
   * 
   * Start with the first element. It is the <w:document> element
   * 
   * For each element in element.elements
   *    What element is this?
   *    Do we have special handling?
   *    Append it to the tree
   */





  convertToSchema(node) {
    if (!node) return;
  
    /* We will build a prose mirror ready schema node from XML node */
    let schemaNode;
    const { name: outerNodeName } = node;
    let { elements = [] } = node;

    /**
     * Who am I?
     * It isn't always clear what node we have from the outer element.
     * Nodes such as lists are paragraphs but contain a list element somewhere.
     */
    //this.log('Who am I?', node.name)

    /* Standard nodes known to need no special handling */
    const standardNodes = ['w:document', 'w:body', 'w:commentRangeStart', 'w:commentRangeEnd', 'w:commentReference'];
    if (standardNodes.includes(outerNodeName)) schemaNode = this._handleStandardNode(node);

    /* w:p: If I am a paragraph, I might be a list item, or possibly other special case */
    if (outerNodeName === 'w:p') {

      /* Special cases of w:p based on paragraph properties */
      const pPr = elements.find(el => el.name === 'w:pPr')
      if (pPr) {
        const paragraphStyle = pPr.elements.find(el => el.name === 'w:pStyle');

        /* If I am a list item... */
        if (paragraphStyle?.attributes['w:val'] === 'ListParagraph') schemaNode = this._handleListNode(node);
      }
      
      /* I am a standard paragraph tag */
      if (!schemaNode) schemaNode = this._handleStandardNode(node);
    }

    /* w:r: If I am a run... */
    if (outerNodeName === 'w:r') {
      schemaNode = this._handleStandardNode(node);
    }

    /* w:t: If I am a text node... */
    if (outerNodeName === 'w:t') schemaNode = this._handleTextNode(node);

    /* Watch for unknown nodes as we build more functionality here */
    if (!schemaNode) console.debug('No schema node:', node);

    return schemaNode;
  }


  _handleListNode(node) {
    /**
     * ❗️❗️ TOOD: We need to get the list type from numbering.xml
     * This will involve having access to additional files here. TBD.
     * Hard coding this for now
     */
    const listType = 'unorderedList';

    // Parse properties
    const { attributes, elements } = this._parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    for (const element of elements) {
      if (element.name === 'w:p') element.name = 'listItem';
      const schemaNode = this.convertToSchema(element);
      if (schemaNode) content.push(schemaNode);
    }

    return {
      type: listType,
      content,
      attrs: {
        type: node.type,
        attributes: attributes || {},
        dataId: 'test'
      }
    }
  }


  _handleStandardNode(node) {
    const { name, type } = node;

    // Parse properties
    const { attributes, elements } = this._parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
      for (const element of elements) {
        const schemaNode = this.convertToSchema(element);
        if (schemaNode) content.push(schemaNode);
      }
    }

    return {
      type: this.getElementName(node),
      content,
      attrs: { type, attributes: attributes || {}, }
    };
  }


  _handleTextNode(node) {
    const { type } = node;

    // Parse properties
    const { attributes, elements } = this._parseProperties(node);

    // Text nodes have no children. Only text.
    const text = elements[0].text;

    return {
      type: this.getElementName(node),
      text: text,
      attrs: { type, attributes: attributes || {}, }
    };
  }


  _parseProperties(node) {
      /**
       * What does it mean for a node to have a properties element?
       * It would have a child element that is: w:pPr, w:rPr, w:sectPr
       */
      const { attributes = {}, elements = [] } = node;
      const [nodes, properties] = this._splitElementsAndProperties(elements);
      if (properties.length) {
        properties.forEach(property => {
          const propType = SuperConverter.propertyTypes[property.name];
          attributes[propType] = property;
        }); 
      }
      return { elements: nodes, attributes }
  }


  _splitElementsAndProperties(elements) {
    return elements.reduce(
      ([els, props], el) => {
        if (SuperConverter.propertyTypes[el.name]) props.push(el);
        else els.push(el);
        return [els, props];
      }, [[], []]
    );
  }




  /**
   * Output section
   *
   * Convert to XML from SCHEMA
   * ❗️ TODO: Much to do here. Anything to do with marks added inside the editor is not yet implemented
   */
  schemaToXml(data) {
    const result = this._generate_xml_as_list(data);
    return result.join('');
  }

  _generate_xml_as_list(data) {
    const json = JSON.parse(JSON.stringify(data));
    const firstElement = json.doc;
    const declaration = this.declaration.attributes;
    const xmlTag = `<?xml${Object.entries(declaration).map(([key, value]) => ` ${key}="${value}"`).join('')}?>`;
    const result = this._generateXml(firstElement);
    return [xmlTag, ...result];
  }

  _processRunProperties(properties) {
    const { elements } = properties;
    return `<w:rPr>${elements.map(element => `<${element.name}/>`).join('')}</w:rPr>`;
  }
  
  _processSectionProperties(properties) {
    const { elements } = properties;
    const { attributesString } = this._processAttrs(properties);
    const sectionPrTag = `<w:sectPr${attributesString}>`;

    let tags = [sectionPrTag];
    for (let element of elements) {
      const { attributesString } = this._processAttrs(element);
      tags.push(`<${element.name}${attributesString}/>`);
    }
    tags.push('</w:sectPr>');
    return tags;
  }

  _processAttrs(attrs) {
    let attributesString = '';
    const { attributes } = attrs;

    const sectionProperties = attributes.sectionProperties;
    delete attributes.sectionProperties;
    let processedSectionProperties;
    if (sectionProperties) processedSectionProperties = this._processSectionProperties(sectionProperties);

    const runProperties = attributes.runProperties;
    delete attributes.runProperties;
    let processedRunProperties;
    if (runProperties) processedRunProperties =this._processRunProperties(runProperties)

    for (let key in attributes) {
      attributesString += ` ${key}="${attributes[key]}"`;
    }
    return {
      attributesString,
      processedRunProperties,
      processedSectionProperties
    }
  }

  _generateXml(node) {
    const { type, content, attrs } = node;
    const name = this.getTagName(type);

    let tag = `<${name}`;

    const { attributesString, processedRunProperties, processedSectionProperties } = this._processAttrs(attrs);
    tag += attributesString;
    tag += '>';
    let tags = [tag];

    // Add run properties if present - these go before the children
    if (processedRunProperties) tags.push(processedRunProperties);

    if (type === 'text') {
      tags.push(node.text);
    }

    // Recursively add the children
    if (content) {
      for (let child of content) {
        tags.push(...this._generateXml(child));
      }
    }

    // Add section properties if present - these go after the content
    if (processedSectionProperties) tags.push(...processedSectionProperties);
  
    tags.push(`</${name}>`);
    return tags;
  }
}

export default SuperConverter;
