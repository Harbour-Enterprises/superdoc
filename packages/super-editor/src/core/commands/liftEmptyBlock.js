import { liftEmptyBlock as originalLiftEmptyBlock } from 'prosemirror-commands';

/**
 * If the cursor is in an empty textblock that can be lifted, lift the block.
 * 
 * https://prosemirror.net/docs/ref/#commands.liftEmptyBlock
 */
export const liftEmptyBlock = () => ({ state, dispatch }) => {
  return originalLiftEmptyBlock(state, dispatch);
};
