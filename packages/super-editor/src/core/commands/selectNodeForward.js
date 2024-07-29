import { selectNodeForward as originalSelectNodeForward } from 'prosemirror-commands';

/**
 * Select a node forward.
 */
export const selectNodeForward = () => ({ state, dispatch }) => {
  return originalSelectNodeForward(state, dispatch);
};
