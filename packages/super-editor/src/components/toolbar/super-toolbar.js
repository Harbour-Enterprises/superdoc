import EventEmitter from 'eventemitter3'
import { createApp } from 'vue'
import { undoDepth, redoDepth } from "prosemirror-history";
import { makeDefaultItems } from './defaultItems';
import { getActiveFormatting } from '@core/helpers/getActiveFormatting.js';
import { vClickOutside } from '@harbour-enterprises/common';
import Toolbar from './Toolbar.vue';
import { startImageUpload, getFileOpener } from '../../extensions/image/imageHelpers/index.js';
import { findParentNode } from '@helpers/index.js';

export class SuperToolbar extends EventEmitter {

  config = {
    element: null,
    toolbarGroups: ['left', 'center', 'right'],
  }

  #interceptedCommands = {
    setZoom: ({ item, argument }) => {
      // Currently only set up to work with full SuperDoc
      if (!argument) return;
      item.onActivate({ zoom: argument });

      this.emit('superdoc-command', { item, argument });
      const layers = document.querySelector('.layers');
      if (!layers) return;
      layers.style.zoom = argument;
    },

    setDocumentMode: ({ item, argument }) => {
      if (!argument) return;
      this.emit('superdoc-command', { item, argument });

      if (argument) this.documentMode = argument.toLowerCase();
      if (this.documentMode === 'viewing') this.#deactivateAll();
    },

    setFontSize: ({ item, argument }) => {
      this.#runCommandWithArgumentOnly({ item, argument });
    },

    setFontFamily: ({ item, argument }) => {
      this.#runCommandWithArgumentOnly({ item, argument });
    },

    setColor: ({ item, argument }) => {
      this.#runCommandWithArgumentOnly({ item, argument });
    },

    startImageUpload: async ({ item, argument }) => {
      let open = getFileOpener();
      let result = await open();

      if (!result?.file) {
        return;
      }

      startImageUpload({
        editor: this.activeEditor,
        view: this.activeEditor.view,
        file: result.file,
      });
    },

    increaseTextIndent: ({ item, argument }) => {
      let command = item.command;
      let { state } = this.activeEditor;
      let listItem = findParentNode((node) => node.type.name === 'listItem')(state.selection);

      if (listItem) {
        return this.activeEditor.chain()
          .sinkListItem('listItem')
          .updateOrderedListStyleType()
          .run();
      }
      
      if (command in this.activeEditor.commands) {
        this.activeEditor.commands[command](argument);
      }
    },

    decreaseTextIndent: ({ item, argument }) => {
      let command = item.command;
      let { state } = this.activeEditor;
      let listItem = findParentNode((node) => node.type.name === 'listItem')(state.selection);

      if (listItem) {
        return this.activeEditor.chain()
          .liftListItem('listItem')
          .updateOrderedListStyleType()
          .run();
      }

      if (command in this.activeEditor.commands) {
        this.activeEditor.commands[command](argument);
      }
    },
  }

  constructor(config) {
    super();
    this.config = { ...this.config, ...config };
    this.toolbarItems = [];
    this.overflowItems = [];
    this.documentMode = 'editing';
    this.isDev = config.isDev || false;
    
    this.#makeToolbarItems(this, config.isDev);

    let el = null;
    if (this.config.element) {
      el = document.getElementById(this.config.element);
      if (!el) throw new Error(`[super-toolbar 🎨] Element not found: ${this.config.element}`);
    }

    this.app = createApp(Toolbar);
    this.app.directive('click-outside', vClickOutside);
    this.app.config.globalProperties.$toolbar = this;
    if (el) this.toolbar = this.app.mount(el);
    this.activeEditor = config.editor || null;

    this.#initDefaultFonts();

    this.#updateToolbarState();
  }

  log(...args) {
    console.debug('[🎨 super-toolbar]', ...args);
  }

  setZoom(percent_int) {
    const percent = percent_int / 100;
    const allItems = [...this.toolbarItems, ...this.overflowItems];
    const item = allItems.find(item => item.name.value === 'zoom');
    this.#interceptedCommands.setZoom({ item, argument: percent });
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
  
  getToolbarItemByGroup(groupName) {
    return this.toolbarItems.filter(item => item.group.value === groupName);
  }

  #makeToolbarItems(superToolbar, isDev = false) {
    const { defaultItems, overflowItems } = makeDefaultItems(superToolbar, isDev, window.innerWidth);
    this.toolbarItems = defaultItems;
    this.overflowItems = overflowItems;
    this.#updateToolbarState();
  }

  #initDefaultFonts() {
    const { typeface = 'Arial', fontSizePt = 12 } = this.activeEditor.converter.getDocumentDefaultStyles() ?? {};
    const fontSizeItem = this.toolbarItems.find(item => item.name.value === 'fontSize');
    fontSizeItem.defaultLabel.value = fontSizePt;

    const fontFamilyItem = this.toolbarItems.find(item => item.name.value === 'fontFamily');
    fontFamilyItem.defaultLabel.value = typeface;
  }

  /**
   * Update the toolbar state. Expects a list of marks in the form: { name, attrs }
   * @param {Object} marks
   */
  #updateToolbarState() {
    this.#updateToolbarHistory();
  
    // Decativate toolbar items if no active editor
    // This will skip buttons that are marked as allowWithoutEditor
    if (!this.activeEditor || this.documentMode === 'viewing') return this.#deactivateAll();

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
  
  onToolbarResize = () => {
    this.#makeToolbarItems(this, this.isDev);
  }

  #deactivateAll() {
    this.activeEditor = null;
    this.toolbarItems.forEach((item) => {
      const { allowWithoutEditor } = item;
      if (allowWithoutEditor.value) return;
      item.setDisabled(true);
    });
  }

  #updateToolbarHistory() {
    if (!this.activeEditor) return;
    this.undoDepth = undoDepth(this.activeEditor.state)
    this.redoDepth = redoDepth(this.activeEditor.state)
  }

  /**
   * React to editor transactions. Might want to debounce this.
   */
  onEditorTransaction({ editor, transaction }) {
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

    if (!command) {
      return;
    }

    this.log('(emmitCommand) Command:', command, item, argument);

    // Attempt to run the command on the active editor.
    if (!this.activeEditor) {
      this.log('(emmitCommand) No active editor');
      return;
    }

    // Check if we have a custom or overloaded command defined
    if (command in this.#interceptedCommands) {
      return this.#interceptedCommands[command]({ item, argument });
    }

    if (command in this.activeEditor.commands) {
      this.activeEditor.commands[command](argument);
      this.#updateToolbarState();
    } else {
      throw new Error(`[super-toolbar 🎨] Command not found: ${command}`);
    }
  }

  #runCommandWithArgumentOnly({ item, argument }) {
    if (!argument || !this.activeEditor) return;
      
    let command = item.command;
    if (command in this.activeEditor.commands) {
      this.activeEditor.commands[command](argument);
      this.#updateToolbarState();
    }
  }
}
