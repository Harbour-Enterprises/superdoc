import { SuperConverter } from './SuperConverter.js';
import { toKebabCase } from '@harbour-enterprises/common';
import { inchesToTwips } from './helpers.js';
import { generateRandomId } from '@helpers/docxIdGenerator.js';

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

  #getValidMarks(node) {
    const { attrs } = node;
    return Object.keys(attrs)
        .filter((key) => SuperConverter.markTypes.find((m) => m.type === key && attrs[key]))
        .map((key) => {
          return { type: key, attrs: { [key]: attrs[key] } };
        });
  }

  #outputProcessNodes(nodes, parent = null) {
    const resultingElements = [];
    let index = 0;

    for (let node of nodes) {
      if (node.seen) continue;
      let skip = false;

      // Special output handling
      let resultingNode;
      switch (node.type) {
        case 'doc':
          resultingNode = this.#outputHandleDocumentNode(node);
          break;
        case 'text':
          if (node.marks?.some((m) => m.type === 'link')) {
            index++;
            // const linkNodes = this.#outputHandleLinkNode(node);
            // resultingElements.push(...linkNodes);

            const newNode = this.#outputHandleLinkNode(node);
            resultingElements.push(newNode);
            continue;
          } else if (!node.seen) {
            resultingNode = this.#outputHandleTextNode(nodes.slice(index));
          }
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
          const marks = this.#getValidMarks(node);
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
    const xmlMark = SuperConverter.markTypes.find((m) => m.type === mark.type);
    const markElement = { name: xmlMark.name, attributes: {} };

    let value;
    switch (mark.type) {
      case 'bold':
        delete markElement.attributes
        markElement.type = 'element';
        break;
      case 'italic':
        delete markElement.attributes
        markElement.type = 'element';
        break;
      case 'underline':
        markElement.type = 'element';
        markElement.attributes['w:val'] = mark.attrs.underlineType;
        break;
      
      // Cases for text styles
      case 'fontSize':
        value = mark.attrs.fontSize;
        markElement.attributes['w:val'] = value.slice(0, -2) * 2;
        break;
      case 'fontFamily':
        value = mark.attrs.fontFamily;
        markElement.attributes['w:ascii'] = value;
        markElement.attributes['w:eastAsia'] = value;
        markElement.attributes['w:hAnsi'] = value;
        markElement.attributes['w:cs'] = value;
        break;
      case 'color':
        let processedColor = mark.attrs.color;
        if (processedColor.startsWith('#')) processedColor = processedColor.slice(1);
        if (processedColor.endsWith(';')) processedColor = processedColor.slice(0, -1);
        markElement.attributes['w:val'] = processedColor;
        break;
      case 'textAlign':
        markElement.attributes['w:val'] = mark.attrs.textAlign;
        break;
      case 'textIndent':
        markElement.attributes['w:firstline'] = inchesToTwips(mark.attrs.textIndent);
        break;
      case 'lineHeight':
        markElement.attributes['w:line'] = inchesToTwips(mark.attrs.lineHeight);
        break;
      case 'link':
        break;
    }

    return markElement;
  }

  #updateListLevel(element, level) {
    const styleElement = element.elements.find((e) => e.name === 'w:numPr');
    const iLvl = styleElement.elements.find((e) => e.name === 'w:ilvl');
    iLvl.attributes['w:val'] = level;
  }
  
  #outputProcessList(node, resultingElements) {
    const { content, attrs } = node;
    const listType = attrs['list-style-type'];
  
    // Each item in the content becomes its own paragraph item in the output
    const flatContent = this.#flattenContent(content);
    const paragraphProperties = node.attrs.attributes?.parentAttributes?.paragraphProperties;
    
    console.debug('\n\n\n ❗️ Flat content:', flatContent, '\n\n')
    flatContent.forEach((n, index) => {
      const pPr = JSON.parse(JSON.stringify(paragraphProperties));
      n.attrs = { ...n.attrs, ...attrs };

      this.#updateListLevel(pPr, n.level);
      const parentAttributes = {
        ...attrs.attributes.parentAttributes,
        paragraphProperties: pPr,
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

  #flattenContent(content, level = 0) {
    const flatContent = [];

    function recursiveFlatten(items, level = 0) {
      if (!items || !items.length) return;
      items.forEach((item) => {
        const subList = item.content.filter((c) => c.type === 'bulletList' || c.type === 'orderedList');
        const notLists = item.content.filter((c) => c.type !== 'bulletList' && c.type !== 'orderedList');

        const newItem = { ...item, content: notLists };
        newItem.level = level;
        flatContent.push(newItem);

        if (subList.length) {
          recursiveFlatten(subList[0].content, level + 1);
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

  // Currently for hyperlinks but there will be other uses
  #generateFldCharNode(type) {
    return {
      name: 'w:r',
      type: 'element',
      elements: [{ name: 'w:fldChar', attributes: { 'w:fldCharType': type } }]
    }
  }

  // Used for generating hyperlinks
  #generateInstrText(data) {
    return {
      name: 'w:r',
      type: 'element',
      elements: [{ name: 'w:instrText', elements: [{ type: 'text', text: data }], }]
    }
  }

  // #outputHandleLinkNode(node) {

  //   let marks = [...node.marks];
  //   const linkMarkIndex = marks.findIndex((m) => m.type === 'link');
  //   const linkMark = marks[linkMarkIndex];
  //   marks.splice(linkMarkIndex, 1);

  //   const processedMarks = this.#outputHandleMarks(marks);
  //   node.marks = node.marks.filter((m) => m.type !== 'link');

  //   const name = this.getTagName('run');
  //   const begin = this.#generateFldCharNode('begin');
  //   const instrText = this.#generateInstrText(`HYPERLINK "${linkMark.attrs.href}" \\h`);
  //   const separate = this.#generateFldCharNode('separate');

  //   // Generate the text node and append marks as run properties
  //   const text = this.#getOutputNode(name, [this.#getOutputNode('w:t', [node], {})], {})
    
  //   const rPr = this.#getOutputNode('w:rPr', processedMarks, {});
  //   if (rPr.elements.length) text.elements.unshift(rPr);

  //   const end = this.#generateFldCharNode('end');
  //   const nodes = [begin, instrText, separate, text, end];

  //   return nodes.map((n) => ({ ...n, seen: true }));
  // }

  #addNewLinkRelationship(link) {
    console.debug('Adding new link relationship:', link);
    const newId = 'rId' + generateRandomId();
    const relationship = {
      "type": "element",
      "name": "Relationship",
      "attributes": {
          "Id": newId,
          "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
          "Target": link,
          "TargetMode": "External"
      }
    }
    const relsData = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const relationships = relsData.elements.find(x => x.name === 'Relationships');
    relationships.elements.push(relationship);
    this.converter.convertedXml['word/_rels/document.xml.rels'] = relsData;
    return newId;
  }

  #outputHandleLinkNode(node) {
    const linkMark = node.marks.find((m) => m.type === 'link');
    const link = linkMark.attrs.href;
    const newId = this.#addNewLinkRelationship(link);

    node.marks = node.marks.filter((m) => m.type !== 'link');
    const outputNode = this.#outputProcessNodes([node]);
    const newNode = {
      name: 'w:hyperlink',
      type: 'element',
      attributes: {
        'r:id': newId,
      },
      elements: outputNode
    }
    return newNode;
  }

  #outputHandleMarks(marks) {
    const elements = [];
    marks.forEach((mark) => {
      console.debug('-- OUTPUT MARK', mark)

      if (mark.type === 'textStyle') {
        Object.keys(mark.attrs).forEach((key) => {
          const value = mark.attrs[key];
          if (!value) return;
          const unwrappedMark = {
            type: key,
            attrs: mark.attrs,
          }
          const markElement = this.#mapOutputMarkToElement(unwrappedMark);
          elements.push(markElement);
        });
      } 

      // All other marks
      else {
        const markElement = this.#mapOutputMarkToElement(mark);
        elements.push(markElement);
      }
    });
    return elements;
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

      // Some marks have special handling - we process them here
      elements.push(...this.#outputHandleMarks(marks));

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
    // console.debug('[SuperConverter] schemaToXml:', data);
    const result = this.#generate_xml_as_list(data);
    // console.debug('[SuperConverter] schemaToXml result:', result.join(''));
    return result.join('');
  }

  #generate_xml_as_list(data) {
    const json = JSON.parse(JSON.stringify(data));
    const firstElement = json.elements[0];
    const declaration = this.converter.declaration.attributes;    
    const xmlTag = `<?xml${Object.entries(declaration).map(([key, value]) => ` ${key}="${value}"`).join('')}?>`;
    const result = this.#generateXml(firstElement);
    const final = [xmlTag, ...result];
    return final;
  }

  #replaceSpecialCharacters(text) {
    return text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  #generateXml(node) {
    const { name, elements, attributes } = node;
    if (!name)  {
      console.debug('NO NAME', node);
    }
    let tag = `<${name}`;

    for (let attr in attributes) {
      tag += ` ${attr}="${attributes[attr]}"`;
    }

    const selfClosing = !elements || !elements.length;
    if (selfClosing) tag += ' />';
    else tag += '>';
    let tags = [tag];

    if (name === 'w:instrText') {
      tags.push(elements[0].text);
    } else if (name === 'w:t') {
      const text = this.#replaceSpecialCharacters(elements[0].text);
      tags.push(text);
    } else {
      if (elements) {
        for (let child of elements) {
          tags.push(...this.#generateXml(child));
        }
      }
    }

    if (!selfClosing) tags.push(`</${name}>`);

    if (name === 'w:instrText') {
      console.debug('INSTR TEXT', tags);
    }
    return tags;
  }
};
