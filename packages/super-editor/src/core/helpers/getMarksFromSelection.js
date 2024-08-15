export function getMarksFromSelection(state) {
  const { from, to, empty } = state.selection;
  const marks = [];

  if (empty) {
    if (state.storedMarks) {
      marks.push(...state.storedMarks);
    }

    marks.push(...state.selection.$head.marks())
  } else {
    state.doc.nodesBetween(from, to, (node) => {
      marks.push(...node.marks);
    });
  }
  return marks;
}

export function getActiveFormatting(editor) {
  const marks = getMarksFromSelection(editor.state);
  const parsedMarks = marks.map((mark) => {
    const { attrs, type } = mark;
    const { name } = type;
    return {
      name,
      attrs,
    }
  });

  const ignoreKeys = ['paragraphSpacing']
  const attributes = getActiveAttributes(editor.state);
  Object.keys(attributes).forEach((key) => {
    if (ignoreKeys.includes(key)) return;
    const attrs = {};
    attrs[key] = attributes[key];
    parsedMarks.push({ name: key, attrs })
  })

  const hasPendingFormatting = !!editor.storage.formatCommands.storedStyle;
  if (hasPendingFormatting) parsedMarks.push({ name: 'copyFormat', attrs: true });
  return parsedMarks;
};

export function getActiveAttributes(state) {
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