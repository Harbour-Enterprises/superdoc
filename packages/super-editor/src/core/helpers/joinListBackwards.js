import { canJoin } from 'prosemirror-transform';
import { findParentNode } from './findParentNode.js';

/**
 * Join list backwards.
 * @param tr Transaction.
 * @param listType List type.
 */
export const joinListBackwards = (tr, listType) => {
  const list = findParentNode(
    (node) => node.type === listType,
    tr.selection,
  );
  if (!list) return true;

  const before = tr.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
  if (before === undefined) return true;

  const nodeBefore = tr.doc.nodeAt(before)
  const canJoinBackwards = list.node.type === nodeBefore?.type && canJoin(tr.doc, list.pos)
  if (!canJoinBackwards) return true;

  tr.join(list.pos);
  return true;
};
