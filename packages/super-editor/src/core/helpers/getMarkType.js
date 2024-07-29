/**
 * Get mark type from schema if it's a string or return directly.
 * @param nameOrType Name or type of the mark.
 * @param schema Schema.
 * @returns Mark type or null.
 */
export function getMarkType(nameOrType, schema) {
  if (typeof nameOrType === 'string') {
    return schema.marks[nameOrType] || null;
  }
  
  return nameOrType;
}
