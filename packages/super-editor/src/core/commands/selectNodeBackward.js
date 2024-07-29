import { selectNodeBackward as originalSelectNodeBackward } from 'prosemirror-commands';

/**
 * Select a node backward.
 */
export const selectNodeBackward = () => ({ state, dispatch }) => {
  return originalSelectNodeBackward(state, dispatch);
};
