import { toggleMark as originalToggleMark } from 'prosemirror-commands';

export const toggleMark = (name) => ({ state, dispatch }) => {
  const type = state.schema.marks[name];
  return originalToggleMark(type)(state, dispatch);
};
