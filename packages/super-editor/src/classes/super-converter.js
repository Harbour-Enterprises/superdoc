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
    // 'w:commentRangeStart': 'commentRangeStart',
    // 'w:commentRangeEnd': 'commentRangeEnd',
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
    const result = this.convertToJson(startElements[0]);

    this.log('\nSchema updated:', result)
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
  convertToJson(element) {
    const name = this.getElementName(element);
    if (!name) {
      this.log('[convertToJson] Missing name', element)
      return null
    }
  
    // Start with the basic schema
    const item = {
      type: name,
      content: [],
      attrs: {
        type: element.type,
        attributes: {},
      }
    }

    element.attributes && (item.attrs.attributes = element.attributes);

    // Special handling for some elements
    if (item.type === 'text') {
      if (!element.elements) return null;

      item.text = element.elements[0].text;
      delete item.content;
    }
  
    if (element.elements && element.elements.length > 0) {

      const currentElements = element.elements;
      const sectionPropertiesIndex = currentElements.findIndex(el => el.name === 'w:sectPr');
      const runPropertiesIndex = currentElements.findIndex(el => el.name === 'w:rPr');

      // Spcial handling for section properties
      if (sectionPropertiesIndex > -1) {
        const properties = currentElements[sectionPropertiesIndex];
        item.attrs.attributes.sectionProperties = properties;
        currentElements.splice(sectionPropertiesIndex, 1);
      }
      
      // Handle elements that are really run properties
      // This should be moved out to its own function/functions as we will get more complex
      if (runPropertiesIndex > -1) {
        const properties = currentElements[runPropertiesIndex];
        item.attrs.attributes.runProperties = properties;
        currentElements.splice(runPropertiesIndex, 1);

        const marks = [];
        for (let mark of properties.elements) {
          const { name } = mark;

          // For now, let's manually handle bold and italic
          if (name === 'w:b') marks.push({ type: 'strong' });
          else if (name === 'w:i') marks.push({ type: 'em' });
        }

        if (marks.length) item.marks = marks;
        this.log('Run Properties:', properties)
      }

      currentElements.forEach(child => {
        const newChild = this.convertToJson(child)
        if (newChild && Array.isArray(newChild)) {
          item.content.push(...newChild);
        } else if (newChild) {
          item.content.push(newChild);
        }
      });
    }
    return item;
  }

  /**
   * 
   * Interim conversion from prose mirror schema to original JSON
   * 
   */
  schemaToXmlJson(data) {
    // Remove selection for now
    const json = JSON.parse(JSON.stringify(data));
    delete json.selection;

    const firstElement = json.doc;
    const result = this.convertElementToJsonXml(firstElement);

    this.log('\n\n XML', result, '\n\n')
    return { 
      declaration: this.declaration,
      elements: [result],
    }
  }

  convertElementToJsonXml(element) {
    const currentType = element.type;
    const name = this.getTagName(currentType);
    const reversedElement = {
      type: currentType,
      name,
    }

    if (element.type === 'text') {
      reversedElement.text = element.text;
    }

    const hasElements = element.content && element.content.length > 0;
    if (hasElements) reversedElement.elements = [];
  
    // This restores the original attributes, which likely contain formatting / marks
    // TODO: Need to actually get the marks on the document as well for export
    // Which would be available in a list of element.marks, if any
    if (element.attrs?.attributes) {
      const runProperties = element.attrs.attributes.runProperties;
      if (runProperties && hasElements) {
        delete element.attrs.attributes.runProperties;
        reversedElement.elements.push(runProperties);
      }

      if (element.marks) {
        // If a text element gets a mark, then we need to bump up that mark to the run level? 
  
        //const runProps = reversedElement.elements.find(el => el.name === 'w:rPr');
        //this.log('Run runProps (output):', runProps, element);

        // for (let mark of element.marks) {
        //   const { type } = mark;
        //   this.log('Mark:', type)

        //   if (type === 'strong') reversedElement.elements.unshift({ name: 'w:b', type: 'element' });
        //   else if (type === 'em') reversedElement.elements.unshift({ name: 'w:i', type: 'element' });
        // }
      }

      const sectionProperties = element.attrs.attributes.properties;
      if (sectionProperties) {
        delete element.attrs.attributes.properties;
        reversedElement.elements.push(sectionProperties);
      }
      reversedElement.attributes = { ...element.attrs.attributes };
    }

    if (hasElements) {
      reversedElement.elements.push(...element.content.map(this.convertElementToJsonXml.bind(this)));
    }

    this.log('Reversed Element:', reversedElement)
    return reversedElement;
  }


  /**
   * Convert to XML from SCHEMA
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
