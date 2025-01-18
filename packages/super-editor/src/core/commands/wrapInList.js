import { wrapInList as originalWrapInList } from 'prosemirror-schema-list';
import { getNodeType } from '../helpers/getNodeType.js';
import { listPluginKey, getNextKeyForList } from '@extensions/ordered-list/helpers/listPlugin.js';

/**
 * Wrap a node in a list.
 * @param typeOrName Type/name of the node.
 * @param attrs Attributes of the node.
 *
 * https://prosemirror.net/docs/ref/#schema-list.wrapInList
 */
//prettier-ignore
export const wrapInList = (typeOrName, attrs = {}) => ({ tr, state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);

  // Since we are generating a new list, we need to track it in our list plugin
  const currentLists = listPluginKey.getState(state)?.lists;
  const newId = getNextKeyForList(currentLists);
  tr.setMeta(listPluginKey, { newId, type });

  return originalWrapInList(type, { ...attrs, listId: newId })(state, dispatch);
};
