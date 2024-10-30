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
    this.storage.users = onAwarenessUpdate(provider);

    // Set the awareness update handler
    provider.awareness.on('update', () => onAwarenessUpdate(provider));
    return [yCursorPlugin(provider.awareness)];

  },
});

const onAwarenessUpdate = (provider) => {
  if (!provider) return;
  return awarenessStatesToArray(provider.awareness.states)
}