import { joinDown as originalJoinDown } from 'prosemirror-commands';

/**
 * Join the selected block, or the closest ancestor of the selection
 * that can be joined, with the sibling after it.
 */
export const joinDown = () => ({ state, dispatch }) => {
  return originalJoinDown(state, dispatch);
};
