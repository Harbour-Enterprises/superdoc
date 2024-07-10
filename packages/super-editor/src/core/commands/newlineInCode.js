import { newlineInCode as originalNewlineInCode } from 'prosemirror-commands';

/**
 * Add a newline character in code.
 */
export const newlineInCode = () => ({ state, dispatch }) => {
  return originalNewlineInCode(state, dispatch);
};
