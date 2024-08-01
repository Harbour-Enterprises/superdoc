import { selectAll as originalSelectAll } from 'prosemirror-commands';

/**
 * Select the whole document.
 * 
 * https://prosemirror.net/docs/ref/#commands.selectAll
 */
export const selectAll = () => ({ state, dispatch }) => {
  return originalSelectAll(state, dispatch);
};
