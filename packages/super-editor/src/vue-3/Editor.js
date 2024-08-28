import { Editor as CoreEditor } from '@core/index.js';
import { customRef, markRaw } from 'vue';

function useDebouncedRef(value) {
  return customRef((track, trigger) => {
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        // update state
        value = newValue;

        // update view as soon as possible
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            trigger();
          });
        });
      },
    }
  });
}

/**
 * Vue Editor wrapper around core Editor class.
 * This allows to have a reactive state and extension storage.
 * 
 * For reference.
 * https://github.com/ueberdosis/tiptap/blob/develop/packages/vue-3/src/Editor.ts
 */
export class Editor extends CoreEditor {
  reactiveState;

  reactiveExtensionStorage;

  constructor(options = {}) {
    super(options);

    this.reactiveState = useDebouncedRef(this.view.state);
    this.reactiveExtensionStorage = useDebouncedRef(this.extensionStorage);

    this.on('transaction', () => {
      this.reactiveState.value = this.view.state;
      this.reactiveExtensionStorage.value = this.extensionStorage;
    });

    return markRaw(this);
  }

  get state() {
    return this.reactiveState ? this.reactiveState.value : this.view.state;
  }

  get storage() {
    return this.reactiveExtensionStorage ? this.reactiveExtensionStorage.value : super.storage;
  }

  /**
   * Register a PM plugin.
   */
  registerPlugin(plugin, handlePlugins) {
    super.registerPlugin(plugin, handlePlugins);
    this.reactiveState.value = this.view.state;
  }

  /**
   * Unregister a PM plugin.
   */
  unregisterPlugin(nameOrPluginKey) {
    super.unregisterPlugin(nameOrPluginKey);
    this.reactiveState.value = this.view.state;
  }

  setDocumentMode(mode) {
    super.setDocumentMode(mode);
  }
}
