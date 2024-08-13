import { Plugin } from 'prosemirror-state';


export function DecorationClick(editor) {
  return new Plugin({
    props: {
      handleClick(view, pos, event) {
        const target = event.target;
        const threadId = target.getAttribute('data-thread-id');
        if (target && threadId) {
          const conversation = editor.getComment(threadId);
          editor.emit('commentClick', { conversation });
        }
        return false;
      }
    }
  });
};
