import { normalizeDocument } from './normalizeDocument.js';

/**
 * Creates the document to pass to EditorState.
 * @param converter SuperConverter instance.
 * @param schema Schema.
 * @returns Document.
 */
export function createDocument(converter, schema) {
  const documentData = converter.getSchema();

  // Experimental.
  let normalizedData;
  try {
    normalizedData = normalizeDocument(documentData);
  } catch (err) {
    normalizedData = documentData;
    console.error(err);
  }

  if (normalizedData) {
    return schema.nodeFromJSON(normalizedData);
  }
  return schema.topNodeType.createAndFill();
}
