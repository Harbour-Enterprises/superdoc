import { toggleMark as originalToggleMark } from 'prosemirror-commands';
import { getMarkType } from '../helpers/getMarkType.js';

/**
 * Toggle mark.
 * @param typeOrName Mark type or name.
 * @param attrs Mark attributes.
 * @returns 
 */
export const toggleMark = (typeOrName, attrs = {}) => ({ state, dispatch }) => {
  const type = getMarkType(typeOrName, state.schema);
  return originalToggleMark(type, attrs)(state, dispatch);
};
