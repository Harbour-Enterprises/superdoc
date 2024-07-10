import { createParagraphNear as originalCreateParagraphNear } from 'prosemirror-commands';

/**
 * Create a paragraph nearby.
 */
export const createParagraphNear = () => ({ state, dispatch }) => {
  return originalCreateParagraphNear(state, dispatch);
};
