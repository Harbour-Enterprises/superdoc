/**
 * Creates the document to pass to EditorState.
 * @param {*} converter SuperConverter instance.
 * @param {*} schema Schema.
 * @param {*} parseOptions Parse options (not used now).
 * @returns Document.
 */
export function createDocument(
  converter,
  schema,
  parseOptions,
) {
  const documentData = converter.getSchema();
  console.debug('\nSCHEMA', JSON.stringify(documentData, null, 2), '\n');
  
  if (documentData) {
    return schema.nodeFromJSON(documentData);
  }
  return schema.topNodeType.createAndFill();
}
