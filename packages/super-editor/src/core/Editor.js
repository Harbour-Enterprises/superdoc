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
import { toggleMark } from "prosemirror-commands";

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

    const icon = (text, name) => {
      let button = document.createElement("div")
      let buttonInner = document.createElement("span")
      buttonInner.textContent = text
      button.appendChild(buttonInner)
      button.className = "menuicon " + name
      button.title = name
      return button
    }

    const addToolbar = (items) => {
      return new Plugin({
        view(editorView) {
          const toolbar = document.createElement('div');
          toolbar.className = 'super-editor-toolbar';
          editorView.dom.parentNode.prepend(toolbar);
          items.forEach(({command, dom}) => {
            console.log('editorView', editorView.state)
            console.log('editorView marks', editorView.state.selection.$head.marks())
            let active = command(editorView.state, null, editorView)
            console.log('active', active)
            dom.style.display = active ? "" : "none"
            // add cursor pointer
            dom.style.cursor = "pointer"
            // add click handler
            dom.addEventListener("mousedown", e => {
              e.preventDefault()
              command(editorView.state, editorView.dispatch, editorView)
              let {$from, to, node} = editorView.state.selection
              console.log('NODE', node)
              // if (node) return node.hasMarkup(nodeType, options.attrs)
              // return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
              editorView.focus()
            })
            toolbar.appendChild(dom)
          })
          return {
            update(view) {
              const marks = view.state.selection.$head.marks();
              // get all buttons
              const buttons = toolbar.querySelectorAll('.menuicon');
              // remove active class from all buttons
              buttons.forEach(button => button.classList.remove('active'));
              marks.forEach(mark => {
                const name = mark.type.name;
                const button = toolbar.querySelector(`.${name}`);
                if (button) {
                  button.classList.add('active');
                }
              });
            }
          }
        }
      });
    }
    const items = [
      {command: toggleMark(DocxSchema.marks.strong), dom: icon("B", "strong")},
      {command: toggleMark(DocxSchema.marks.em), dom: icon("i", "em")},
      {command: toggleMark(DocxSchema.marks.underline), dom: icon("u", "underline")},
      {command: toggleMark(DocxSchema.marks.strikethrough), dom: icon("s", "strikethrough")},

      // {command: setBlockType(schema.nodes.paragraph), dom: icon("p", "paragraph")},
      // heading(1), heading(2), heading(3),
      // {command: wrapIn(schema.nodes.blockquote), dom: icon(">", "blockquote")}
    ]

    const newState = this.state.reconfigure({
      plugins: [ // Get plugins from extension service?
        history(),
        buildKeymap(),
        addToolbar(items)
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
