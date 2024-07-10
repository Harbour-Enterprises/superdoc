import { joinUp as originalJoinUp } from 'prosemirror-commands';

/**
 * Join the selected block or, if there is a text selection, the
 * closest ancestor block of the selection that can be joined, with
 * the sibling above it.
 */
export const joinUp = () => ({ state, dispatch }) => {
  return originalJoinUp(state, dispatch);
};
