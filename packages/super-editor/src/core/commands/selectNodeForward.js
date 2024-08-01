import { selectNodeForward as originalSelectNodeForward } from 'prosemirror-commands';

/**
 * Select a node forward.
 * 
 * https://prosemirror.net/docs/ref/#commands.selectNodeForward
 */
export const selectNodeForward = () => ({ state, dispatch }) => {
  return originalSelectNodeForward(state, dispatch);
};
