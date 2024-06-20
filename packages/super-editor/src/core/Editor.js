import {
  MarkType,
  Node as ProseMirrorNode,
  NodeType,
  Schema,
} from 'prosemirror-model';
import {
  EditorState, Plugin, PluginKey, Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { history } from "prosemirror-history";

import { buildKeymap } from './shortcuts/buildKeymap.js';
import { DocxSchema } from './schema/DocxSchema.js';
import { SuperConverter } from './SuperConverter.js';
import { EventEmitter } from './EventEmitter.js';
import { initComments } from '@extensions/Comments/comments.js';
import { createDocument } from './helpers/createDocument.js';
import { createStyleTag } from './utilities/createStyleTag.js';
import { style } from './style.js';

export class Editor extends EventEmitter {
  #commandService;

  extensionService;

  extensionStorage = {};

  schema;

  view;

  #css;

  options = {
    element: document.createElement('div'),
    content: '',
    documentId: null,
    injectCSS: true,
    extensions: [],
    editable: true,
    editorProps: {},
    parseOptions: {},
    coreExtensionOptions: {},
    enableInputRules: true,
    enablePasteRules: true,
    enableCoreExtensions: true,
    onBeforeCreate: () => null,
    onCreate: () => null,
    onUpdate: () => null,
    onSelectionUpdate: () => null,
    onTransaction: () => null,
    onFocus: () => null,
    onBlur: () => null,
    onDestroy: () => null,
    onContentError: ({ error }) => { throw error },
    onCommentsLoaded: () => null,
  }

  constructor(options) {
    super();

    this.setOptions(options);
    this.#createExtensionService();
    this.#createCommandService();
    this.#createSchema();
    this.#createConverter();

    this.on('beforeCreate', this.options.onBeforeCreate);
    this.emit('beforeCreate', { editor: this });
    this.on('contentError', this.options.onContentError);

    this.#createView();
    this.#injectCSS()

    this.on('create', this.options.onCreate);
    this.on('update', this.options.onUpdate);
    this.on('selectionUpdate', this.options.onSelectionUpdate);
    this.on('transaction', this.options.onTransaction);
    this.on('focus', this.options.onFocus);
    this.on('blur', this.options.onBlur);
    this.on('destroy', this.options.onDestroy);
    this.on('comments-loaded', this.options.onCommentsLoaded);

    this.#loadComments();

    window.setTimeout(() => {
      if (this.isDestroyed) return;
      this.emit('create', { editor: this });
    }, 0);
  }

  get state() {
    return this.view.state;
  }

  get store() {
    return this.extensionStorage;
  }

  get isEditable() {
    return this.options.editable && this.view && this.view.editable;
  }

  get isDestroyed() {
    return !this.view?.docView;
  }

  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
    };

    if (!this.view || !this.state || this.isDestroyed) {
      return;
    }

    if (this.options.editorProps) {
      this.view.setProps(this.options.editorProps);
    }

    this.view.updateState(this.state);
  }

  setEditable(editable, emitUpdate = true) {
    this.setOptions({ editable });

    if (emitUpdate) {
      this.emit('update', { editor: this, transaction: this.state.tr });
    }
  }

  registerPlugin(plugin, handlePlugins) {
    const plugins = typeof handlePlugins === 'function' 
      ? handlePlugins(plugin, [...this.state.plugins])
      : [...this.state.plugins, plugin];

    const state = this.state.reconfigure({ plugins });

    this.view.updateState(state);
  }


  unregisterPlugin(nameOrPluginKey) {
    if (this.isDestroyed) {
      return;
    }
    
    const name = typeof nameOrPluginKey === 'string'
      ? `${nameOrPluginKey}$`
      : nameOrPluginKey.key;

    const state = this.state.reconfigure({
      plugins: this.state.plugins.filter((plugin) => !plugin.key.startsWith(name)),
    });

    this.view.updateState(state);
  }

  #injectCSS() {
    if (this.options.injectCSS && document) {
      this.#css = createStyleTag(style);
    }
  }

  #createExtensionService() {}

  #createCommandService() {}

  #createConverter() {
    this.converter = new SuperConverter({ 
      docx: this.options.content, 
      debug: true,
    });
  }

  // Build schema from extensions?
  #createSchema() {
    this.schema = DocxSchema;
  }

  #createView() {
    let doc;

    try {
      doc = createDocument(
        this.converter,
        this.schema,
        this.options.parseOptions,
      );
    } catch (err) {
      console.error(err);

      this.emit('contentError', {
        editor: this,
        error: err,
      });

      // Here we can try to create document again.
    }

    this.view = new EditorView(this.options.element, {
      ...this.options.editorProps,
      dispatchTransaction: this.#dispatchTransaction.bind(this),
      state: EditorState.create({
        doc,
      }),
    });

    const newState = this.state.reconfigure({
      plugins: [ // Get plugins from extension service?
        history(),
        buildKeymap(),
      ],
    });
    this.view.updateState(newState);

    // Create Node Views?

    const dom = this.view.dom;
    dom.editor = this;
  }

  #dispatchTransaction(transaction) {
    if (this.view.isDestroyed) {
      return;
    }
    
    const state = this.state.apply(transaction);
    const selectionHasChanged = !this.state.selection.eq(state.selection);

    this.view.updateState(state);
    this.emit('transaction', {
      editor: this,
      transaction,
    });

    if (selectionHasChanged) {
      this.emit('selectionUpdate', {
        editor: this,
        transaction
      });
    }

    if (!transaction.docChanged) {
      return;
    }

    this.emit('update', {
      editor: this,
      transaction,
    });
  }

  #loadComments() {
    const comments = initComments(
      this.view, 
      this.converter, 
      this.options.documentId,
    );
    this.emit('comments-loaded', { comments });
  }

  getJSON() {
    return this.state.doc.toJSON();
  }

  save() {
    console.debug('EDITOR CLASS SAVE - TODO', this.state.doc.toJSON());
    // const converter = new SuperConverter();
    console.debug('new converter', this.converter, this.converter.declaration)

    const xml = this.converter.schemaToXml({ doc: this.state.doc.toJSON() });
    console.debug('XML', xml);
  }

  destroy() {
    this.emit('destroy');
    if (this.view) this.view.destroy();
    this.removeAllListeners();
  }
}
