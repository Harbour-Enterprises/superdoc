import { canJoin } from 'prosemirror-transform';
import { findParentNode } from './findParentNode.js';

/**
 * Join list forwards.
 * @param tr Transaction.
 * @param listType List type.
 */
export const joinListForwards = (tr, listType) => {
  const list = findParentNode(
    (node) => node.type === listType,
    tr.selection,
  );
  if (!list) return true;

  const after = tr.doc.resolve(list.start).after(list.depth)
  if (after === undefined) return true;

  const nodeAfter = tr.doc.nodeAt(after)
  const canJoinForwards = list.node.type === nodeAfter?.type && canJoin(tr.doc, after)
  if (!canJoinForwards) return true;

  tr.join(after);
  return true;
};
