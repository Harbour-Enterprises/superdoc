import { getMarksFromSelection } from './getMarksFromSelection.js';
import { findMark } from './findMark.js';

export function getActiveFormatting(editor) {
  const { state } = editor;
  const { selection } = state;

  const marks = getMarksFromSelection(state);

  const marksToProcess = marks
    .filter((mark) =>  !['textStyle', 'link'].includes(mark.type.name))
    .map((mark) => ({ name: mark.type.name, attrs: mark.attrs }));

  const textStyleMarks = marks.filter((mark) => mark.type.name === 'textStyle');
  marksToProcess.push(...textStyleMarks.flatMap(unwrapTextMarks));

  const linkMarkType = state.schema.marks['link'];
  const linkMark = findMark(state, linkMarkType);

  if (linkMark) {
    let { from, to, attrs } = linkMark;

    if (selection.from >= from && selection.to <= to) {
      marksToProcess.push({ name: 'link', attrs });
    }
  }

  const ignoreKeys = ['paragraphSpacing'];
  const attributes = getActiveAttributes(state);
  Object.keys(attributes).forEach((key) => {
    if (ignoreKeys.includes(key)) return;
    const attrs = {};
    attrs[key] = attributes[key];
    marksToProcess.push({ name: key, attrs });
  });

  const hasPendingFormatting = !!editor.storage.formatCommands?.storedStyle;
  if (hasPendingFormatting) marksToProcess.push({ name: 'copyFormat', attrs: true });
  return marksToProcess;
}

function unwrapTextMarks(textStyleMark) {
  const processedMarks = [];
  const { attrs } = textStyleMark;
  Object.keys(attrs).forEach((key) => {
    if (!attrs[key]) return;
    processedMarks.push({ name: key, attrs: { [key]: attrs[key] } });
  });
  return processedMarks;
}

function getActiveAttributes(state) {
  const { from, to, empty } = state.selection;
  const attributes = {};
  const getAttrs = (node) => {
    Object.keys(node.attrs).forEach((key) => {
      const value = node.attrs[key];
      if (value) {
        attributes[key] = value;
      }
    });
  };

  let start = from;
  let end = to;
  if (empty) state.doc.nodesBetween(start, end + 1, (node) => getAttrs(node));
  else state.doc.nodesBetween(from, to, (node) => getAttrs(node));
  return attributes;
}
