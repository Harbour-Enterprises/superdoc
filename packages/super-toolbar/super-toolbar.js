import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { undoDepth, redoDepth } from "prosemirror-history";

import { makeDefaultItems } from '../super-editor/src/components/toolbar/defaultItems';
import { getActiveFormatting } from '../super-editor/src/core/helpers/getMarksFromSelection';
import Toolbar from '../super-editor/src/components/toolbar/Toolbar.vue'
import clickOutside from '@common/helpers/v-click-outside';

export class SuperToolbar extends EventEmitter {

  config = {
    element: null,
    onToolbarCommand: () => null,
  }

  #nonEditorCommands = {
    setZoom: ({ item, argument }) => {
      // Currently only set up to work with full SuperDoc
      if (!argument) return;
      item.onActivate({ zoom: argument });

      const layers = document.querySelector('.layers');
      if (!layers) return;
      layers.style.zoom = argument;
    }
  }

  constructor(config) {
    super();
    this.config = { ...this.config, ...config };

    this.#makeToolbarItems(this);

    const el = document.getElementById(this.config.element);
    if (!el) throw new Error(`[super-toolbar 🎨] Element not found: ${this.config.element}`);

    this.app = createApp(Toolbar);
    this.app.directive('click-outside', clickOutside);
    this.app.config.globalProperties.$toolbar = this;
    this.toolbar = this.app.mount(el);
    this.activeEditor = config.editor || null;
    this.#updateToolbarState();
  }

  log(...args) {
    console.debug('[🎨 super-toolbar]', ...args);
  }

  /**
   * The toolbar expects an active Super Editor instance.
   * @param {*} editor 
   */
  setActiveEditor(editor) {
    this.activeEditor = editor;
    this.activeEditor.on('transaction', this.onEditorTransaction.bind(this));
    this.#updateToolbarState();
  }

  #makeToolbarItems(superToolbar) {
    const defaultItems = makeDefaultItems(superToolbar);
    this.toolbarItems = defaultItems;
    this.#updateToolbarState();
  }

  /**
   * Update the toolbar state. Expects a list of marks in the form: { name, attrs }
   * @param {Object} marks
   */
  #updateToolbarState() {
    this.#updateToolbarHistory();
  
    if (!this.activeEditor) {
      console.debug('[super-toolbar 🎨] No active editor');

      this.toolbarItems.forEach((item) => {
        const { allowWithoutEditor } = item;
        if (allowWithoutEditor.value) return;
        console.debug('[super-toolbar 🎨] Deactivating:', item.allowWithoutEditor.value, item.name.value);
        item.setDisabled(true);
      });
      return;
    }

    const marks = getActiveFormatting(this.activeEditor);
    this.toolbarItems.forEach((item) => {
      item.resetDisabled();

      const activeMark = marks.find(mark => mark.name === item.name.value);
      if (activeMark) {
        item.activate(activeMark.attrs);
      } else {
        item.deactivate();
      }

    });
  }

  #updateToolbarHistory() {
    if (!this.activeEditor) return;
    this.undoDepth =  undoDepth(this.activeEditor.state)
    this.redoDepth = redoDepth(this.activeEditor.state)
  }

  /**
   * React to editor transactions. Might want to debounce this.
   */
  onEditorTransaction() {
    this.#updateToolbarState();
   }

  /**
   * Main handler for toolbar commands.
   * 
   * @param {Object} item is an instance of the useToolbarItem composable
   * @param {Object} argument is the argument passed to the command
   */
  emitCommand({ item, argument }) {
    const { command } = item;
    if (!command) return;
    this.log('(emmitCommand) Command:', command, item, argument);

    // Some commands don't affect the editor, check if we have a custom command defined
    if (command in this.#nonEditorCommands) return this.#nonEditorCommands[command]({ item, argument });
  
    // Attempt to run the command on the active editor.
    if (this.activeEditor) {

      if (command in this.activeEditor.commands) {
        this.activeEditor.commands[command](argument);
        this.#updateToolbarState();
      }

      else throw new Error(`[super-toolbar 🎨] Command not found: ${command}`);
    }
    
    else {
      this.log('(emmitCommand) No active editor');
    }

  }
}