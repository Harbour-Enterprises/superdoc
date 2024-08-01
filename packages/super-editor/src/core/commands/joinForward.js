import { joinForward as originalJoinForward } from 'prosemirror-commands';

/**
 * Join two nodes forward.
 * 
 * If the selection is empty and the cursor is at the end of a
 * textblock, try to reduce or remove the boundary between that block
 * and the one after it, either by joining them or by moving the other
 * block closer to this one in the tree structure. Will use the view
 * for accurate start-of-textblock detection if given.
 * 
 * https://prosemirror.net/docs/ref/#commands.joinForward
 */
export const joinForward = () => ({ state, dispatch }) => {
  return originalJoinForward(state, dispatch);
};
