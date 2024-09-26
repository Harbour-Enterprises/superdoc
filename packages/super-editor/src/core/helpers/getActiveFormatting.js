import { getMarksFromSelection } from './getMarksFromSelection.js';

export function getActiveFormatting(editor) {
  const marks = getMarksFromSelection(editor.state);
  const marksToProcess = marks.filter((mark) => mark.type.name !== 'textStyle')
                              .map((mark) => ({ name: mark.type.name, attrs: mark.attrs }));
  const textStyleMarks = marks.filter(mark => mark.type.name === 'textStyle');
  marksToProcess.push(...textStyleMarks.flatMap(unwrapTextMarks));

  const ignoreKeys = ['paragraphSpacing']
  const attributes = getActiveAttributes(editor.state);
  Object.keys(attributes).forEach((key) => {
    if (ignoreKeys.includes(key)) return;
    const attrs = {};
    attrs[key] = attributes[key];
    marksToProcess.push({ name: key, attrs })
  })

  const hasPendingFormatting = !!editor.storage.formatCommands.storedStyle;
  if (hasPendingFormatting) marksToProcess.push({ name: 'copyFormat', attrs: true });
  return marksToProcess;
};

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
    Object.keys(node.attrs).forEach(key => {
      const value = node.attrs[key];
      if (value) {
        attributes[key] = value;
      }
    });
  }

  let start = from;
  let end = to;
  if (empty) state.doc.nodesBetween(start, end + 1, (node) => getAttrs(node))
  else state.doc.nodesBetween(from, to, (node) => getAttrs(node));
  return attributes;
};
