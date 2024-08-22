import { getNodeType, posToDOMRect } from '@core/helpers/index.js';
import { getAllFieldAnnotations } from './getAllFieldAnnotations.js';

/**
 * Get all field annotations with rects in the doc.
 * @param typeOrName The node type or name.
 * @param view The editor view.
 * @param state The editor state.
 * @returns The array of field annotations with rects.
 */
export function getAllFieldAnnotationsWithRect(typeOrName, view, state) {
  let nodeType = getNodeType(typeOrName, state.schema);

  let fieldAnnotations = getAllFieldAnnotations(nodeType.name, state)
    .map(({ node, pos }) => {
      let rect = posToDOMRect(view, pos, pos + node.nodeSize);
      return {
        node,
        pos,
        rect,
      };
    });

  return fieldAnnotations;
}
