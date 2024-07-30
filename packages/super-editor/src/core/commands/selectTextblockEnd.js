import { selectTextblockEnd as originalSelectTextblockEnd } from 'prosemirror-commands';

/**
 * Moves the cursor to the end of current text block.
 * 
 * https://prosemirror.net/docs/ref/#commands.selectTextblockEnd
 */
export const selectTextblockEnd = () => ({ state, dispatch }) => {
  return originalSelectTextblockEnd(state, dispatch);
};
