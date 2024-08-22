import { helpers } from '@core/index.js';

const { findChildren, getNodeType } = helpers;

/**
 * Get all field annotations in the doc.
 * @param typeOrName The node type or name.
 * @param state The editor state.
 * @returns The array of field annotations.
 */
export function getAllFieldAnnotations(typeOrName, state) {
  let nodeType = getNodeType(typeOrName, state.schema);

  let fieldAnnotations = findChildren(state.doc, (node) => (
    node.type.name === nodeType.name
  ));

  return fieldAnnotations;
}
