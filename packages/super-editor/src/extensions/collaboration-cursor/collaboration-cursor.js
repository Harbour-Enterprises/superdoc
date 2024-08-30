import { Extension } from '@core/index.js';
import { yCursorPlugin } from 'y-prosemirror'

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
    this.options.provider = this.editor.options.collaborationProvider || null;
    const onAwarenessUpdate = () => {
      if (!this.options.provider) return;
      this.storage.users = awarenessStatesToArray(this.options.provider.awareness.states)
    }

    if (!this.options.provider) return [];
    return [
      yCursorPlugin(
        (() => {
          onAwarenessUpdate();
          this.options.provider.awareness.on('update', onAwarenessUpdate);
          return this.options.provider.awareness
        })(),
        {
          cursorBuilder: this.options.render,
          selectionBuilder: this.options.selectionRender,
        },
      ),
    ]

  },
});

const awarenessStatesToArray = (states) => {
  return Array.from(states.entries()).map(([key, value]) => {
    return {
      clientId: key,
      ...value.user,
    }
  })
}
