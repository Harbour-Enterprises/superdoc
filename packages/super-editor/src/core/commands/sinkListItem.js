import { sinkListItem as originalSinkListItem } from 'prosemirror-schema-list';
import { getNodeType } from '../helpers/getNodeType.js';

/**
 * Sink list item down into an inner list.
 * @param typeOrName Type/name of the node.
 */
export const sinkListItem = (typeOrName) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  return originalSinkListItem(type)(state, dispatch);
};
