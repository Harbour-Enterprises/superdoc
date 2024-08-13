/**
 * Creates the document to pass to EditorState.
 * @param converter SuperConverter instance.
 * @param schema Schema.
 * @returns Document.
 */
export function createDocument(converter, schema) {
  const documentData = converter.getSchema();
  if (documentData) {
    return schema.nodeFromJSON(documentData);
  }
  return schema.topNodeType.createAndFill();
}
