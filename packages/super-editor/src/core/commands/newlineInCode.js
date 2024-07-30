import { newlineInCode as originalNewlineInCode } from 'prosemirror-commands';

/**
 * Add a newline character in code.
 * 
 * https://prosemirror.net/docs/ref/#commands.newlineInCode
 */
export const newlineInCode = () => ({ state, dispatch }) => {
  return originalNewlineInCode(state, dispatch);
};
