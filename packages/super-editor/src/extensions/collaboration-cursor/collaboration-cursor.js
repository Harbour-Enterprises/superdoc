import { Extension } from '@core/index.js';
import { yCursorPlugin } from 'y-prosemirror'
import { awarenessStatesToArray } from '@harbour-enterprises/common/collaboration/awareness.js';

export const CollaborationCursor = Extension.create({
  name: 'collaborationCursor',

  priority: 999,

  addOptions() {
    return {
      provider: null,
      user: {
        name: null,
        color: null,
      }
    }
  }, 

  addStorage() {
    return {
      users: [],
    }
  },

  addPmPlugins() {
    const { collaborationProvider: provider = null } = this.editor.options;
    if (!provider) return [];

    // Track initial users
    this.storage.users = onAwarenessUpdate(provider, this.editor.options.colors);

    // Set the awareness update handler
    provider.awareness.on('update', () => {
      this.storage.users = onAwarenessUpdate(provider, this.editor.options.colors);
    });
    return [yCursorPlugin(provider.awareness, { cursorBuilder: customCursors })];
  },
});

const onAwarenessUpdate = (provider, colors) => {
  if (!provider) return;
  return awarenessStatesToArray(provider.awareness.states, colors)
}

const customCursors = (user) => {
  const cursor = document.createElement('span')
  cursor.classList.add('ProseMirror-yjs-cursor')
  cursor.setAttribute('style', `border-color: ${user.color}`)

  const userDiv = document.createElement('div')
  userDiv.setAttribute('style', `background-color: ${user.color}`)
  userDiv.insertBefore(document.createTextNode(user.name), null)
  cursor.insertBefore(userDiv, null)
  return cursor
}