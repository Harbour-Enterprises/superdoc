import { SuperConverter } from "../../SuperConverter.js";
import { TrackFormatMarkName } from "@extensions/track-changes/constants.js";
import { twipsToInches } from "../../helpers.js";

/**
 *
 * @param property
 * @returns {PmMarkJson[]}
 */
export function parseMarks(property, unknownMarks = []) {
  const marks = [];
  const seen = new Set();

  property?.elements?.forEach((element) => {
    const marksForType = SuperConverter.markTypes.filter((mark) => mark.name === element.name);
    if (!marksForType.length) {
      const missingMarks = [
        'w:shd',
        'w:rStyle',
        'w:pStyle',
        'w:numPr',
        'w:outlineLvl',
        'w:bdr',
        'w:pBdr',
        'w:noProof',
        'w:highlight',
        'w:contextualSpacing',
        'w:keepNext',
        'w:tabs',
        'w:keepLines'
      ];
      if (missingMarks.includes(element.name)) {
        unknownMarks.push(element.name);
      };
    }

    marksForType.forEach((m) => {
      if (!m || seen.has(m.type)) return;
      seen.add(m.type);

      const { attributes = {} } = element;
      const newMark = { type: m.type }

      if (attributes['w:val'] == "0" || attributes['w:val'] === 'none') {
        return;
      }

      // Use the parent mark (ie: textStyle) if present
      if (m.mark) newMark.type = m.mark;

      // Marks with attrs: we need to get their values
      if (Object.keys(attributes).length) {
        const value = getMarkValue(m.type, attributes);
        newMark.attrs = {};
        newMark.attrs[m.property] = value;
      }
      marks.push(newMark);
    })
  });
  return createImportMarks(marks)
}


/**
 *
 * @param {XmlNode} rPr
 * @param {PmMarkJson[]} currentMarks
 * @returns {PmMarkJson[]} a trackMarksMark, or an empty array
 */
export function handleStyleChangeMarks(rPr, currentMarks) {
  const styleChangeMark = rPr.elements?.find((el) => el.name === 'w:rPrChange')
  if (!styleChangeMark) {
    return []
  }

  const { attributes } = styleChangeMark;
  const mappedAttributes = {
    id: attributes['w:id'],
    date: attributes['w:date'],
    author: attributes['w:author'],
    authorEmail: attributes['w:authorEmail'],
  }
  const submarks = parseMarks(styleChangeMark);
  return [{ type: TrackFormatMarkName, attrs: { ...mappedAttributes, before: submarks, after: [...currentMarks] } }]
}


/**
 *
 * @param {PmMarkJson[]} marks
 * @returns {PmMarkJson[]}
 */
export function createImportMarks(marks) {
  const textStyleMarksToCombine = marks.filter((mark) => mark.type === 'textStyle');
  const remainingMarks = marks.filter((mark) => mark.type !== 'textStyle');

  // Combine text style marks
  const combinedTextAttrs = {};
  if (textStyleMarksToCombine.length) {
    textStyleMarksToCombine.forEach((mark) => {
      const { attrs = {} } = mark;

      Object.keys(attrs).forEach((attr) => {
        combinedTextAttrs[attr] = attrs[attr];
      });
    });
  };

  const result = [...remainingMarks, { type: 'textStyle', attrs: combinedTextAttrs }];
  return result;
}


/**
 *
 * @param {string} markType
 * @param attributes
 * @returns {*}
 */
function getMarkValue(markType, attributes) {
  if (markType === 'tabs') markType = 'textIndent';

  const markValueMapper = {
    color: () => `#${attributes['w:val']}`,
    fontSize: () => `${attributes['w:val'] / 2}pt`,
    textIndent: () => getIndentValue(attributes),
    fontFamily: () => attributes['w:ascii'],
    lineHeight: () => getLineHeightValue(attributes),
    textAlign: () => attributes['w:val'],
    link: () => attributes['href'],
    underline: () => attributes['w:val'],
    bold: () => attributes?.['w:val'] || null,
    italic: () => attributes?.['w:val'] || null,
  }

  if (!(markType in markValueMapper)) {
    console.debug('❗️❗️ No value mapper for:', markType, 'Attributes:', attributes)
  };

  // Returned the mapped mark value
  if (markType in markValueMapper) {
    const f = markValueMapper[markType];
    return markValueMapper[markType]();
  }
}


function getIndentValue(attributes) {
  let value = attributes['w:left'];
  if (!value) value = attributes['w:firstLine'];
  return `${twipsToInches(value)}in`
}

function getLineHeightValue(attributes) {
  let value = attributes['w:line'];

  // TODO: Figure out handling of additional line height attributes from docx
  // if (!value) value = attributes['w:lineRule'];
  // if (!value) value = attributes['w:after'];
  // if (!value) value = attributes['w:before'];
  if (!value || value === "0") return null;
  return `${twipsToInches(value)}in`;
}