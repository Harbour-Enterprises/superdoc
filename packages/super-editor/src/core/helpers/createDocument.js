
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
