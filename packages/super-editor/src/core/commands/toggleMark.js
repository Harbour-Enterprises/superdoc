import { toggleMark as originalToggleMark } from 'prosemirror-commands';

export const toggleMark = (name, attrs) => ({ state, dispatch }) => {
  const type = state.schema.marks[name];
  return originalToggleMark(type, attrs)(state, dispatch);
};
