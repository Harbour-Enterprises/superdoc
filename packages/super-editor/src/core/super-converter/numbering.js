const orderedListTypes = [
  "decimal", // eg: 1, 2, 3, 4, 5, ...
  "decimalZero", // eg: 01, 02, 03, 04, 05, ...
  "lowerRoman", // eg: i, ii, iii, iv, v, ...
  "upperRoman", // eg: I, II, III, IV, V, ...
  "lowerLetter", // eg: a, b, c, d, e, ...
  "upperLetter", // eg: A, B, C, D, E, ...
  "ordinal", // eg: 1st, 2nd, 3rd, 4th, 5th, ...
  "cardinalText", // eg: one, two, three, four, five, ...
  "ordinalText", // eg: first, second, third, fourth, fifth, ...
  "hex", // eg: 0, 1, 2, ..., 9, A, B, C, ..., F, 10, 11, ...
  "chicago", // eg: (0, 1, 2, ..., 9, 10, 11, 12, ..., 19, 1A, 1B, 1C, ..., 1Z, 20, 21, ..., 2Z)
];

const unorderedListTypes = [
  "bullet", // A standard bullet point (•)
  "square", // Square bullets (▪)
  "circle", // Circle bullets (◦)
  "disc", // Disc bullets (●)
]

/**
 * Main function to get list item information from numbering.xml
 * 
 * @param {object} attributes 
 * @param {int} level 
 * @returns 
 */
function getNodeNumberingDefinition(attributes, level) {
  if (!attributes) return;

  const def = this.convertedXml['word/numbering.xml'];
  if (!def) return {};

  const { elements } = def;
  const listData = elements[0];

  const { paragraphProperties } = attributes;
  const { elements: listStyles } = paragraphProperties;
  const numPr = listStyles.find(style => style.name === 'w:numPr');
  if (!numPr) {
    return {};
    throw new Error(`No numbering properties found in paragraph: ${JSON.stringify(attributes)}`);
  }
  
  // Get the indent level
  const ilvlTag = numPr.elements.find(style => style.name === 'w:ilvl');
  const ilvl = ilvlTag.attributes['w:val'];

  // Get the list style id
  const numIdTag = numPr.elements.find(style => style.name === 'w:numId');
  const numId = numIdTag.attributes['w:val'];


  // Get the list styles
  const numberingElements = listData.elements;
  const abstractDefinitions = numberingElements.filter(style => style.name === 'w:abstractNum')
  const numDefinitions = numberingElements.filter(style => style.name === 'w:num')
  const numDefinition = numDefinitions.find(style => style.attributes['w:numId'] === numId);
  const abstractNumId = numDefinition?.elements[0].attributes['w:val']
  const listDefinitionForThisNumId = abstractDefinitions?.find(style => style.attributes['w:abstractNumId'] === abstractNumId);

  // Determine list type and formatting for this list level
  const currentLevel = getDefinitionForLevel(listDefinitionForThisNumId, level);
  if (!currentLevel) return {}

  const start = currentLevel.elements.find(style => style.name === 'w:start')?.attributes['w:val'];
  const listTypeDef = currentLevel.elements.find(style => style.name === 'w:numFmt').attributes['w:val'];
  const lvlText = currentLevel.elements.find(style => style.name === 'w:lvlText').attributes['w:val'];
  const lvlJc = currentLevel.elements.find(style => style.name === 'w:lvlJc').attributes['w:val'];

  // Properties - there can be run properties and paragraph properties
  const pPr = currentLevel.elements.find(style => style.name === 'w:pPr');
  let listpPrs, listrPrs;
  if (pPr) listpPrs = _processListParagraphProperties(pPr);

  const rPr = currentLevel.elements.find(style => style.name === 'w:rPr');
  if (rPr) listrPrs = _processListRunProperties(rPr);

  // Get style for this list level
  let listType;
  if (unorderedListTypes.includes(listTypeDef.toLowerCase())) listType = 'bulletList';
  else if (orderedListTypes.includes(listTypeDef)) listType = 'orderedList';
  else {
    throw new Error(`Unknown list type found during import: ${listTypeDef}`);
  }

  return { listType, listOrderingType: listTypeDef,  ilvl, numId, listrPrs, listpPrs, start, lvlText, lvlJc };
}

function getDefinitionForLevel(data, level) {
  return data?.elements?.find((item) => Number(item.attributes['w:ilvl']) === level);
}

function _processListParagraphProperties(data) {
  const { elements } = data;
  const expectedTypes = ['w:ind', 'w:jc', 'w:tabs'];
  const paragraphProperties = {};
  if (!elements) return paragraphProperties;

  elements.forEach((item) => { 
    if (!expectedTypes.includes(item.name)) throw new Error(`[numbering.xml] Unexpected list paragraph prop found: ${item.name}`);
    const { attributes = {} } = item;
    Object.keys(attributes).forEach(key => {
      paragraphProperties[key] = attributes[key];
    });
  });
  return paragraphProperties;
}

function _processListRunProperties(data) {
  const { elements } = data;
  const expectedTypes = ['w:rFonts', 'w:b', 'w:bCs', 'w:i', 'w:iCs', 'w:strike', 'w:dstrike', 'w:color', 'w:sz', 'w:szCs', 'w:u', 'w:bdr', 'w:shd', 'w:vertAlign', 'w:jc', 'w:spacing', 'w:w', 'w:smallCaps'];
  const runProperties = {};
  if (!elements) return runProperties;

  elements.forEach((item) => { 
    if (!expectedTypes.includes(item.name)) throw new Error(`[numbering.xml] Unexpected list run prop found: ${item.name}`);
    const { attributes = {} } = item;
    Object.keys(attributes).forEach(key => {
      runProperties[key] = attributes[key];
    });
  });
  return runProperties;
}

export {
  orderedListTypes,
  unorderedListTypes,

  getNodeNumberingDefinition
}