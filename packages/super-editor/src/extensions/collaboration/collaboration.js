import { Extension } from '@core/index.js';
import {
  ySyncPlugin,
  yUndoPlugin,
  yUndoPluginKey,
  undo,
  redo,
} from 'y-prosemirror'

export const Collaboration = Extension.create({
  name: 'collaboration',

  priority: 1000,

  addOptions() {
    return {
      ydoc: null,
      field: 'supereditor',
      fragment: null,
    }
  },

  addPmPlugins() {
    if (!this.editor.options.ydoc) return [];
    this.options.ydoc = this.editor.options.ydoc;

    // Listen for document lock changes
    initDocumentLockHandler(this.options.ydoc, this.editor);
    initSyncListener(this.options.ydoc, this.editor);

    const [syncPlugin, fragment] = createSyncPlugin(
      this.options.ydoc,
      this.editor
    );
    this.options.fragment = fragment;

    const undoPlugin = createUndoPlugin();
    return [syncPlugin, undoPlugin]
  },

  addCommands() {
    return {
      undo: () => ({ tr, state, dispatch }) => {
        tr.setMeta('preventDispatch', true)
        tr.setMeta('inputType', 'historyUndo');
        const undoManager = yUndoPluginKey.getState(state).undoManager
        if (undoManager.undoStack.length === 0) return false
        if (!dispatch) return true
        return undo(state)
      },
      redo: () => ({ tr, state, dispatch }) => {
        tr.setMeta('preventDispatch', true)
        tr.setMeta('inputType', 'historyRedo');
        const undoManager = yUndoPluginKey.getState(state).undoManager
        if (undoManager.redoStack.length === 0) return false
        if (!dispatch) return true;
        return redo(state)
      },
    }
  },

  addShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-Shift-z': () => this.editor.commands.redo(),
      'Mod-y': () => this.editor.commands.redo(),
    }
  }
});

const createSyncPlugin = (ydoc, editor) => {
  const fragment = ydoc.getXmlFragment("supereditor");

  console.debug('--- Setting initial content ---', editor.options.content)
  const onFirstRender = () => {
    const metaMap = ydoc.getMap('meta');
    metaMap.set('docx', editor.options.content);
  };

  window.supereditor = editor;
  return [ySyncPlugin(fragment, { onFirstRender }), fragment];
};

const createUndoPlugin = () => {
  const yUndoPluginInstance = yUndoPlugin();
  return yUndoPluginInstance;
};

const initDocumentLockHandler = (ydoc, editor) => {
  const metaMap = ydoc.getMap('meta');
  metaMap.observe((event) => {
    const lockedBy = metaMap.get('lockedBy');
    const isLocked = metaMap.get('locked');
    if (!editor.options.user || !lockedBy) return;
    const emitEvent = lockedBy?.email !== editor.options.user?.email;

    // If the event was initiated by this user, don't emit anything
    const editableChanged = editor.options.editable !== !isLocked;
    if (!emitEvent || !editableChanged) return;

    // Otherwise, we need to emit the event for all other users
    if (isLocked) {
      console.debug('--- Locking editor ---', lockedBy, editor.options.user)
    } else {
      console.debug('--- Unlocking editor ---',lockedBy)
    }
    editor.setEditable(!isLocked);
    editor.emit('locked', { editor, isLocked, lockedBy });
  });
};

const initSyncListener = (ydoc, editor) => {
  const provider = editor.options.collaborationProvider;
  if (!provider) return;

  const emit = () => {
    provider.off('synced', emit);
    editor.emit('collaborationUpdate', { editor, ydoc });
  };

  if (provider.synced) return emit();
  provider.on('synced', emit);
};