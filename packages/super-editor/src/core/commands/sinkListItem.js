import { sinkListItem as originalSinkListItem } from 'prosemirror-schema-list';
import { getNodeType } from '../helpers/getNodeType.js';
import { findParentNode } from '@helpers/index.js';
import { TextSelection } from "prosemirror-state";

/**
 * Sink list item down into an inner list.
 * @param typeOrName Type/name of the node.
 *
 * https://prosemirror.net/docs/ref/#schema-list.sinkListItem
 */
//prettier-ignore
export const sinkListItem = (typeOrName) => ({ state, dispatch, tr }) => {
  const type = getNodeType(typeOrName, state.schema);

  const list = findParentNode((node) => node.type.name === 'orderedList')(state.selection);
  tr.setMeta('originalList', list);

  return originalSinkListItem(type)(state, dispatch);
};
