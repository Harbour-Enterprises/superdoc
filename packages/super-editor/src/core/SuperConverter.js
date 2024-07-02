import xmljs from 'xml-js';


/**
 * Class to translate from DOCX XML to Prose Mirror Schema and back
 * 
 * Will need to be updated as we find new docx tags.
 * 
 */
export class SuperConverter {

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

  static markTypes = Object.freeze({
    'w:b': 'bold',
    'w:i': 'italic',
    'w:u': 'underline',
    'w:strike': 'strike',
  });

  static propertyTypes = Object.freeze({
    'w:pPr': 'paragraphProperties',
    'w:rPr': 'runProperties',
    'w:sectPr': 'sectionProperties',
    'w:numPr': 'numberingProperties',
  });


  constructor(params = null) {
    // Suppress logging when true
    this.debug = params?.debug || false;

    // The docx as a list of files
    this.convertedXml = {};
    this.docx = params?.docx || [];
  
    // XML inputs
    this.xml = params?.xml;
    this.declaration = null;

    // The JSON converted XML before any processing. This is simply the result of xml2json
    this.initialJSON = null;

    // This is the JSON schema that we will be working with
    this.json = params?.json;

    // Parse the initial XML, if provided
    // this.log('Original XML:', this.xml)
    if (this.docx.length || this.xml) this.parseFromXml();
  }


  log(...args) {
    if (this.debug) console.debug(...args);
  }

  getTagName(name) {
    const keys = Object.keys(SuperConverter.allowedElements)
    return keys.find(key => SuperConverter.allowedElements[key] === name);
  }

  parseFromXml() {
    this.docx.forEach(file => {
      this.convertedXml[file.name] = JSON.parse(xmljs.xml2json(file.content, null, 2));
    });
    
    this.initialJSON = this.convertedXml['word/document.xml'];
    console.debug('Initial JSON:', this.initialJSON);

    if (!this.initialJSON) this.initialJSON = JSON.parse(xmljs.xml2json(this.xml, null, 2));
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
  convertToSchema(node, parent = null) {
    if (!node || node.seen) return;
  
    /* We will build a prose mirror ready schema node from XML node */
    let schemaNode;
    const { name: outerNodeName } = node;
    console.debug('current node', node.name, node);

    /**
     * Who am I?
     * It isn't always clear what node we have from the outer element.
     * Nodes such as lists are paragraphs but contain a list element somewhere.
     */
    //this.log('Who am I?', node.name)
    // this.log('Node', node);

    /* Standard nodes known to need no special handling */
    const standardNodes = ['w:document', 'w:body', 'w:commentRangeStart', 'w:commentRangeEnd', 'w:commentReference'];
    if (standardNodes.includes(outerNodeName)) schemaNode = this._handleStandardNode(node);

    /* w:p: If I am a paragraph, I might be a list item, or possibly other special case */
    if (outerNodeName === 'w:p') {

      /**
       * Special cases of w:p based on paragraph properties
       * 
       * If we detect a list node, we need to get all nodes that are also lists and process them together
       * in order to combine list item nodes into list nodes.
       */
      if (this._testForList(node)) {
        // Get all siblings that are list items and haven't been processed yet.
        const siblings = parent.elements.filter(el => !el.seen);
        const listItems = [];
      
        // Iterate each item until we find the end of the list (a non-list item),
        // then send to the list handler for processing.
        let possibleList = siblings.shift();
        while (possibleList && this._testForList(possibleList)) {
          listItems.push(possibleList);
          possibleList = siblings.shift();
        }
      
        schemaNode = this.#handleListNode(node, listItems);
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
    if (!schemaNode) {
      // console.debug('No schema:', node);
      const ignore = ['w:t'];
      if (!ignore.includes(outerNodeName)) console.debug('No schema node:', node);
    } else if (!['text','run','paragraph','doc','body','orderedList'].includes(schemaNode.type)) {

      // Watch for unknown list types or other undefined types
      // console.debug('Schema node:', schemaNode);
    }

    console.debug('Schema node:', schemaNode)
    node.seen = true;
    return schemaNode;
  }


  _testForList(node) {
    const { elements } = node;
    const pPr = elements?.find(el => el.name === 'w:pPr')
    if (!pPr) return false;

    const paragraphStyle = pPr.elements.find(el => el.name === 'w:pStyle');
    const isList = paragraphStyle?.attributes['w:val'] === 'ListParagraph';
    const hasNumPr = pPr.elements.find(el => el.name === 'w:numPr');
    return isList || hasNumPr;
  }

  _getNodeListType(attributes) {
    const def = this.convertedXml['word/numbering.xml'];
    if (!def) return {};

    const { paragraphProperties } = attributes;
    const { elements: listStyles } = paragraphProperties;
    const numPr = listStyles.find(style => style.name === 'w:numPr');
    
    // Get the indent level
    const ilvlTag = numPr.elements.find(style => style.name === 'w:ilvl');
    const ilvl = ilvlTag.attributes['w:val'];

    // Get the list style id
    const numIdTag = numPr.elements.find(style => style.name === 'w:numId');
    const numId = numIdTag.attributes['w:val'];
    const numberingElements = def.elements[0].elements;

    // Get the list styles
    const abstractDefinitions = numberingElements.filter(style => style.name === 'w:abstractNum')
    const numDefinitions = numberingElements.filter(style => style.name === 'w:num')
    const numDefinition = numDefinitions.find(style => style.attributes['w:numId'] === numId);
    const abstractNumId = numDefinition.elements[0].attributes['w:val']
    const abstractNum = abstractDefinitions.find(style => style.attributes['w:abstractNumId'] === abstractNumId);

    // Determine list type
    const currentLevelDef = abstractNum.elements.find(style => style.name === 'w:lvl');
    const currentLevel = currentLevelDef.elements.find(style => style.name === 'w:numFmt')
    const listTypeDef = currentLevel.attributes['w:val'];
    let listType;
    if (listTypeDef === 'bullet') listType = 'bulletList';
    else if (listTypeDef === 'decimal') listType = 'orderedList';
    else if (listTypeDef === 'lowerLetter') listType = 'bulletList';

    // Check for unknown list types, there will be some
    if (!listType) console.debug('_getNodeListType: No list type:', listTypeDef, attributes)
    return { listType, ilvl, numId, abstractNum };
  }



  /**
   * List Nodes
   * 
   * This recursive function takes the current node (the first list item detected in the current array)
   * and all list items that follow it.
   * 
   * It begins with listLevel = 0, and if we find an indented node, we call this function again and increase the level.
   * with the same set of list items (as we do not know the node levels until we process them).
   *
   * @param {Object} node - The current node being processed.
   * @param {Array} listItems - Array of list items to process.
   * @param {number} [listLevel=0] - The current indentation level of the list.
   * @returns {Object} The processed list node with structured content.
   */
  #handleListNode(node, listItems, listLevel = 0) {
    const parsedListItems = [];
    let overallListType;

    for (let [index, item] of listItems.entries()) {
      if (item.seen) continue;

      const { attributes, elements, marks = [] } = this._parseProperties(item);
      const { listType, ilvl } = this._getNodeListType(attributes);
      const intLevel = parseInt(ilvl);

      // Since this function is recursive, but at any depth we are iterating over the same items
      // We need to skip any items that are below the current level (as they will be processed by a higher level)
      if (listLevel > intLevel) continue;

      const content = [];
      const sublist = {};

      // If we have found a new indentation level, we will go a level deeper and call this function again,
      // The result becomes the content of the current list item.
      if (listLevel < intLevel) {
        Object.assign(sublist, this.#handleListNode(item, listItems, listLevel + 1));
      } 
      
      // Standard processing: we parse the element and add it to the content
      else {
        overallListType = listType;
        item.seen = true;

        for (const element of elements) {
          // We replace the w:r here for a w:p for the sake of the schema which prefers <li><p>...</p></li>
          if (element.name === 'w:r') element.name = 'w:p';
          const schemaNode = this.convertToSchema(element);
          if (schemaNode) content.push(schemaNode);
        }
      }

      // If we have a sublist, then insert it into the previous node's content
      // Otherwise, create a new list item node.
      if (Object.keys(sublist).length) {
        const item = parsedListItems[index - 1]
        item?.content.push(sublist);
      } else {
        parsedListItems.push(this.#createListItem(content, attributes, marks));
      }
    }

    node.seen = true;
    return {
      type: overallListType || 'bulletList',
      content: parsedListItems,
    };
  }

  /**
   * Creates a list item node with specified content and marks.
   *
   * @param {Array} content - The content of the list item.
   * @param {Array} marks - The marks associated with the list item.
   * @returns {Object} The created list item node.
   */
  #createListItem(content, attrs, marks) {
    return {
      type: 'listItem',
      content,
      attrs,
      marks,
    };
  }




  _handleStandardNode(node) {
    const { name, type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = this._parseProperties(node);

    // Iterate through the children and build the schemaNode content
    const content = [];
    if (elements && elements.length) {
      for (const element of elements) {
        const schemaNode = this.convertToSchema(element, node);
        if (schemaNode) content.push(schemaNode);
      }
    }

    return {
      type: this.getElementName(node),
      content,
      attrs: { type, attributes: attributes || {}, },
      marks,
    };
  }


  _handleTextNode(node) {
    const { type } = node;

    // Parse properties
    const { attributes, elements, marks = [] } = this._parseProperties(node);

    // Text nodes have no children. Only text.
    let text;
    if (elements.length === 1) text = elements[0].text;
    else return null;

    return {
      type: this.getElementName(node),
      text: text || '',
      attrs: { type, attributes: attributes || {}, },
      marks,
    };
  }


  _parseMarks(property) {
    const marks = [];
    property.elements.forEach((element) => {
      const mark = SuperConverter.markTypes[element.name];
      if (!mark) return;
      marks.push({ type: mark });
    });

    // if (marks.length) console.debug('Marks:', marks )
    return marks;
  }


  _parseProperties(node) {
      /**
       * What does it mean for a node to have a properties element?
       * It would have a child element that is: w:pPr, w:rPr, w:sectPr
       */
      let marks = [];
      const { attributes = {}, elements = [] } = node;
      const [nodes, properties] = this._splitElementsAndProperties(elements);

      if (properties.length) {
        properties.forEach(property => {
          const propType = SuperConverter.propertyTypes[property.name];
          attributes[propType] = property;

          marks = this._parseMarks(property);
        }); 
      }
      return { elements: nodes, attributes, marks }
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






  outputToJson(data) {
    console.debug('[SuperConverter] outputToJSON:', data);
    const firstElement = data.doc;
    const result = {
      declaration: this.declaration,
      elements: this.#outputNodeToJson(firstElement),
    }
    console.debug('Result:', result);
  }

  #outputNodeToJson(node, parent = null) {
    let name = this.getTagName(node.type);
    console.debug('Output node:', node.type, node.name, name);
    
    const elements = [];
    const { content, attrs } = node;

    // Nodes that can't be mapped back to a name tag need special handling. ie: list nodes
    if (node.type === 'listItem') name = 'w:r';

    if (!name) {
      const isList = ['orderedList', 'bulletList'].includes(node.type);
      if (isList) { 
        console.debug('List node:', node.type);
        
        const listElements = [];
        for (let child of content) {
          const processedChild = {
            name: 'w:p',
            elements: this.#outputNodeToJson(child, node),
            attributes: {}
          }
          console.debug('Processed child:', processedChild);
          listElements.push(processedChild);
        }
        console.debug('List elements:', listElements);
        return listElements;
      }
    }
    
    // Standard handling of nodes
    else {
      if (content) {
        for (let child of content) {
          const processedChild = this.#outputNodeToJson(child, node);
          if (Array.isArray(processedChild)) elements.push(...processedChild);
          else elements.push(processedChild)
        }
      }
    }

    return {
      name,
      elements,
      attributes: attrs?.attributes || {}
    }
  }

    #outputHandleListNode(node) {

    }





  /**
   * Output section
   *
   * Convert to XML from SCHEMA
   * ❗️ TODO: Much to do here. Anything to do with marks added inside the editor is not yet implemented
   */
  schemaToXml(data) {
    console.debug('[SuperConverter] schemaToXml:', data);
    const result = this._generate_xml_as_list(data);
    return result.join('');
  }

  _generate_xml_as_list(data) {
    const json = JSON.parse(JSON.stringify(data));
    const firstElement = json.doc;
    const declaration = this.declaration.attributes;
    console.debug('Declaration:', declaration);
    
    const xmlTag = `<?xml${Object.entries(declaration).map(([key, value]) => ` ${key}="${value}"`).join('')}?>`;
    console.debug('Xml tag', xmlTag)
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
    let name = this.getTagName(type);

    if (!name) {
      console.debug('Custom tag', type);
      const lists = ['orderedList', 'bulletList'];
      if (lists.includes(type)) {
        console.debug('\n\n LIST NODE', node, '\n\n')
        name = 'w:p'
      }
      return [];
    }

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
