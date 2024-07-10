import { selectAll as originalSelectAll } from 'prosemirror-commands';

/**
 * Select the whole document.
 */
export const selectAll = () => ({ state, dispatch }) => {
  return originalSelectAll(state, dispatch);
};
