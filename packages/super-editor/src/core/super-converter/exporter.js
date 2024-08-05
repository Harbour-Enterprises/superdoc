import { SuperConverter } from './SuperConverter.js';
import { toKebabCase } from '@common/key-transform.js';
import { inchesToTwips } from './helpers.js';

export class DocxExporter {

  constructor(converter) {
    this.converter = converter;
  }

  getTagName(name) {
    const keys = Object.keys(SuperConverter.allowedElements)
    return keys.find(key => SuperConverter.allowedElements[key] === name);
  }
    
  outputToJson(data) {
    const firstElement = data;
    const result = {
      declaration: this.converter.declaration,
      elements: this.#outputProcessNodes([firstElement]),
    }
    return result;
  }

  #outputProcessNodes(nodes, parent = null) {
    const resultingElements = [];
    let index = 0;
    for (let node of nodes) {
      if (node.seen) continue;
      let skip = false;
      const nodeToProcess = { ...node };

      // Special output handling
      switch (node.type) {
        case 'doc':
          node = this.#outputHandleDocumentNode(node);
          break;
        case 'text':
          node = this.#outputHandleTextNode(nodes.slice(index));
          skip = true;
          break;
        case 'orderedList':
          this.#outputProcessList(node, resultingElements);
          skip = true;
          break;
        case 'bulletList':
          this.#outputProcessList(node, resultingElements)
          skip = true;
          break;
        case 'body':
          break
        default:
          // console.debug("\n\n OTHER NODE", node.type, node, '\n\n')
          break;
      }

      let resultingNode = node;

      console.debug('Processing node:', node)

      let name = this.getTagName(node.type);
      if (!skip) {
        const { content, attrs } = node;
        let attributes = attrs?.attributes || {};

        let nodeContents = [];
        if (content && content.length) nodeContents.push(...this.#outputProcessNodes(content, node));

        resultingNode = this.#getOutputNode(name, nodeContents, attributes);
        const sectionProperties = attributes?.sectionProperties;
        if (sectionProperties) {
          delete resultingNode.attributes;
          resultingNode.elements.push(sectionProperties)
        }

        if (node.type === 'paragraph') {
          const marks = node.marks;
          const markElements = [];
          if (marks) {
            marks.forEach((mark) => {
              const markElement = this.#mapOutputMarkToElement(mark);

              if (mark.type === 'textIndent') {
                markElements.unshift(markElement);
              } else markElements.push(markElement);
            });
            const pPr = {
              name: 'w:pPr',
              type: 'element',
              elements: markElements,
            }

            const hasIndent = markElements.find((m) => m.name === 'w:ind');
            if (hasIndent) {
              console.debug('\n\n INDENTPPR', pPr, '\n\n')
            }
            resultingNode.elements.unshift(pPr);
          }
        }
      }
      
      index++;

      const skipNodes = ['bulletList', 'orderedList'];
      if (!skipNodes.includes(node.type)) resultingElements.push(resultingNode);
      if (SuperConverter.elements.has(name)) resultingNode.type = 'element';
    }

    return resultingElements;
  }

  #mapOutputMarkToElement(mark) {
    const kebabCase = toKebabCase(mark.type);
    const value = mark.attrs?.attributes?.style?.split(`${kebabCase}: `)[1];

    const xmlMark = SuperConverter.markTypes.find((m) => m.type === mark.type);
    const markElement = { name: xmlMark.name, attributes: {} };


    switch (mark.type) {
      case 'textAlign':
        markElement.attributes['w:val'] = value;
        break;
      case 'textIndent':
        markElement.attributes['w:firstline'] = inchesToTwips(value);
        console.debug('textIndent:', markElement);

        break;
      case 'fontSize':
        markElement.attributes['w:val'] = value.slice(0, -2) * 2;
        break;
      case 'fontFamily':
        markElement.attributes['w:ascii'] = value;
        markElement.attributes['w:eastAsia'] = value;
        markElement.attributes['w:hAnsi'] = value;
        markElement.attributes['w:cs'] = value;
        break;
      case 'color':
        let processedColor = value;
        if (value.startsWith('#')) processedColor = value.slice(1);
        if (value.endsWith(';')) processedColor = value.slice(0, -1);
        markElement.attributes['w:val'] = processedColor;
        break;
      case 'bold':
        delete markElement.attributes
        markElement.type = 'element';
        break;
      case 'italic':
        delete markElement.attributes
        markElement.type = 'element';
        break;
      case 'lineHeight':
        markElement.attributes['w:line'] = inchesToTwips(value);
        break;
    }

    console.debug('Mark element:', markElement)
    return markElement;
  }

  #outputProcessList(node, resultingElements) {
    const { content, attrs } = node;
    const listType = attrs['list-style-type'];
  
    // Each item in the content becomes its own paragraph item in the output
    const flatContent = this.#flattenContent(content);
    console.debug('\n\n\n ❗️ Flat content:', flatContent, '\n\n')
    flatContent.forEach((n) => {

      n.attrs = { ...n.attrs, ...attrs };
      const parentAttributes = {
        paragraphProperties: node.attrs.attributes?.parentAttributes?.paragraphProperties,
        ...attrs.attributes.parentAttributes,
      }
      n.attrs.attributes = { parentAttributes };

      const output = this.#convertListItemForOutput(n);
      resultingElements.push(output);
    })

  }

  #convertListItemForOutput(n) {

    const textElements = [];
    n.content.forEach((c) => {
      if (!c.content) return;
      textElements.push(...c.content);
    });

    const elements = [];
    let parentAttributes = null;
    parentAttributes = n.attrs.attributes?.parentAttributes || {};
    const { paragraphProperties } = parentAttributes;

    if (paragraphProperties) {
      elements.push(paragraphProperties);
      delete parentAttributes.paragraphProperties;
    }

    const processedElements = this.#outputProcessNodes(textElements);
    elements.push(...processedElements);
    return {
      name: 'w:p',
      type: 'element',
      attributes: parentAttributes,
      elements,
    };
  }

  #flattenContent(content) {
    const flatContent = [];
    function recursiveFlatten(items) {
      if (!items || !items.length) return;
      items.forEach((item) => {
        const subList = item.content.filter((c) => c.type === 'bulletList' || c.type === 'orderedList');
        const notLists = item.content.filter((c) => c.type !== 'bulletList' && c.type !== 'orderedList');

        const newItem = { ...item, content: notLists };
        flatContent.push(newItem);

        if (subList.length) {
          console.debug('Sublists:', subList)
          recursiveFlatten(subList[0].content);
        }
      })
    }
    recursiveFlatten(content);
    return flatContent;
  }

  #getOutputNode(name, elements, attributes = {}) {
    return {
      name,
      elements,
      attributes: Object.keys(attributes).length ? attributes : undefined,
      type: 'element',
    }
  }

  #outputHandleDocumentNode(node) {
    // Restore section props
    const storedBody = this.converter.savedTagsToRestore.find((n) => n.name === 'w:body');
    const sectPr = storedBody.elements.find((n) => n.name === 'w:sectPr');
    const bodyNode = {
      type: 'body',
      content: node.content,
      attrs: {
        attributes: {
          sectionProperties: sectPr
        },
      }
    }
    node.content = [bodyNode];
    return node;
  }

  #outputHandleTextNode(nodes) {
    const groupedTextNodes = [];
    let index = 0;
    let groupedNode = nodes[index];
    const attrs = groupedNode?.attrs;
    const marks = groupedNode?.marks;

    let runProperties = null;
    if (marks) {
      const elements = [];
      marks.forEach((mark) => {
        console.debug('-- OUTPUT MARK', mark)
        const marksToApply = SuperConverter.markTypes.filter((m) => m.type === mark.type)
        marksToApply.forEach((m) => {
          const markElement = this.#mapOutputMarkToElement(mark);
          elements.push(markElement);
        });
      });

      runProperties = {
        name: 'w:rPr',
        type: 'element',
        elements
      }
    }

    while (groupedNode?.type === 'text' && groupedNode.attrs === attrs && groupedNode.marks === marks) {
      groupedNode.seen = true;
      groupedTextNodes.push(groupedNode);
      groupedNode = nodes[++index];
    }
    
    const nodeContents = groupedTextNodes.map((n) => { 
      const { text } = n;
      const hasLeadingOrTrailingSpace = /^\s|\s$/.test(text);
      const space = hasLeadingOrTrailingSpace ? 'preserve' : null;
      const attrs = space ? { 'xml:space': space } : null;

      const newNode = {
        type: 'element',
        name: 'w:t',
        elements: [{ text: n.text, type: 'text' }]
      }
      if (attrs && Object.keys(attrs).length) newNode.attributes = attrs;
      return newNode;
    });

    if (runProperties && runProperties.elements.length) {
      nodeContents.unshift(runProperties);
    }
    const name = this.getTagName('run');
    const output = this.#getOutputNode(name, nodeContents, attrs);
    return output;
  }

  schemaToXml(data) {
    console.debug('[SuperConverter] schemaToXml:', data);
    const result = this._generate_xml_as_list(data);
    return result.join('');
  }

  _generate_xml_as_list(data) {
    const json = JSON.parse(JSON.stringify(data));
    const firstElement = json.elements[0];
    const declaration = this.converter.declaration.attributes;    
    const xmlTag = `<?xml${Object.entries(declaration).map(([key, value]) => ` ${key}="${value}"`).join('')}?>`;
    const result = this._generateXml(firstElement);
    const final = [xmlTag, ...result];
    return final;
  }

  _generateXml(node) {
    const { name, elements, attributes } = node;
    let tag = `<${name}`;

    for (let attr in attributes) {
      tag += ` ${attr}="${attributes[attr]}"`;
    }

    const selfClosing = !elements || !elements.length;
    if (selfClosing) tag += ' />';
    else tag += '>';
    let tags = [tag];

    if (name === 'w:t') {
      tags.push(elements[0].text);
    } else {

      // Recursively add the children
      if (elements) {
        for (let child of elements) {
          tags.push(...this._generateXml(child));
        }
      }
    }

    if (!selfClosing) tags.push(`</${name}>`);
    return tags;
  }
};
