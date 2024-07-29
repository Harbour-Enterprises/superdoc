import { deleteSelection as originalDeleteSelection } from 'prosemirror-commands';

/**
 * Delete the selection, if there is one.
 */
export const deleteSelection = () => ({ state, dispatch }) => {
  return originalDeleteSelection(state, dispatch);
};
