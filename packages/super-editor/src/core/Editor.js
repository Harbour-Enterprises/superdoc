import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { DOMParser, DOMSerializer } from "prosemirror-model"
import { EventEmitter } from './EventEmitter.js';
import { ExtensionService } from './ExtensionService.js';
import { CommandService } from './CommandService.js';
import { Attribute } from './Attribute.js';
import { SuperConverter } from '@core/super-converter/SuperConverter.js';
import { Commands, Keymap, Editable, EditorFocus } from './extensions/index.js';
import { createDocument } from './helpers/createDocument.js';
import { isActive } from './helpers/isActive.js';
import { createStyleTag } from './utilities/createStyleTag.js';
import { initComments } from '@features/index.js';
import { style } from './config/style.js';
import DocxZipper from '@core/DocxZipper.js';

/**
 * Editor main class.
 */
export class Editor extends EventEmitter {
  #commandService;

  extensionService;

  extensionStorage = {};

  schema;

  view;

  documentMode;

  isFocused = false;
  
  #css;

  #comments;

  options = {
    element: document.createElement('div'),
    content: '', // XML content
    media: {},
    mode: 'docx',
    converter: null,
    fileSource: null,
    documentId: null,
    injectCSS: true,
    extensions: [],
    editable: true,
    editorProps: {},
    parseOptions: {},
    coreExtensionOptions: {},
    isNewFile: false,
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
    onCommentClicked: () => null,
    onFirstRender: () => {
      console.log('\n\n\n\nFirst render\n\n\n');
    }
  }

  constructor(options) {
    super();

    this.setOptions(options);
    this.setDocumentMode(options.documentMode);

    let modes = {
      docx: () => this.#init(this.options),
      text: () => this.#initRichText(this.options),
      default: () => {
        console.log('Not implemented.');
      },
    };

    let initMode = modes[this.options.mode] ?? modes.default;
    initMode();
  }

  #init(options) {
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
    this.on('focus', this.#onFocus);
    this.on('blur', this.options.onBlur);
    this.on('destroy', this.options.onDestroy);
    this.on('commentsLoaded', this.options.onCommentsLoaded);
    this.on('commentClick', this.options.onCommentClicked);

    this.#loadComments();
    this.#initCollaboration();

    window.setTimeout(() => {
      if (this.isDestroyed) return;
      this.#initDefaultStyles();
      this.emit('create', { editor: this });
    }, 0);
  }

  #initRichText(options) {
    console.debug('Initializing rich text editor:', options);

    this.#createExtensionService();
    this.#createCommandService();
    this.#createSchema();

    this.on('beforeCreate', this.options.onBeforeCreate);
    this.emit('beforeCreate', { editor: this });
    this.on('contentError', this.options.onContentError);

    this.#createView();
    this.#injectCSS()

    this.on('create', this.options.onCreate);
    this.on('update', this.options.onUpdate);
    this.on('selectionUpdate', this.options.onSelectionUpdate);
    this.on('transaction', this.options.onTransaction);
    this.on('focus', this.#onFocus);
    this.on('blur', this.options.onBlur);
    this.on('destroy', this.options.onDestroy);
    this.on('commentsLoaded', this.options.onCommentsLoaded);
    this.on('commentClick', this.options.onCommentClicked);

    window.setTimeout(() => {
      if (this.isDestroyed) return;
      this.emit('create', { editor: this });
    }, 0);
  }

  #onFocus({ editor, event }) {
    this.toolbar?.setActiveEditor(editor);
    this.options.onFocus({ editor, event });
  }

  setToolbar(toolbar) {
    this.toolbar = toolbar;
  }

  /**
   * Get the editor state.
   */
  get state() {
    return this.view.state;
  }

  /**
   * Get the editor storage.
   */
  get storage() {
    return this.extensionStorage;
  }

  /**
   * Get object of registered commands.
   */
  get commands() {
    return this.#commandService.commands;
  }

  /**
   * Check if the editor is editable.
   */
  get isEditable() {
    return this.options.editable && this.view && this.view.editable;
  }

  /**
   * Check if editor is destroyed.
   */
  get isDestroyed() {
    return this.view.isDestroyed; // !this.view?.docView
  }

  /**
   * Get the editor element
   */
  get element() {
    return this.options.element;
  }

  /**
   * Get possible users of the editor.
   */
  get users() {
    return this.options.users;
  }

  /**
   * Create a chain of commands to call multiple commands at once.
   */
  chain() {
    return this.#commandService.chain();
  }

  /**
   * Check if a command or a chain of commands can be executed. Without executing it.
   */
  can() {
    return this.#commandService.can();
  }

  setDocumentMode(documentMode) {
    this.documentMode = documentMode?.toLowerCase() || 'viewing';
    if (!this.extensionService) return;

    // Viewing mode: Not editable, no tracked changes, no comments
    if (this.documentMode === 'viewing') {
      this.unregisterPlugin('comments');
      // this.unregisterPlugin('TrackChangesBase');
      this.setEditable(false, false);
    }

    // Suggesting: Editable, tracked changes plugin enabled, comments
    else if (this.documentMode === 'suggesting') {
      this.#registerPluginByNameIfNotExists('comments')
      // this.#registerPluginByNameIfNotExists('TrackChangesBase');
      // this.commands.enableTrackChanges();
      this.setEditable(true, false);
    }

    // Editing: Editable, tracked changes plguin disabled, comments
    else if (this.documentMode === 'editing') {
      // this.#registerPluginByNameIfNotExists('TrackChangesBase');
      this.#registerPluginByNameIfNotExists('comments');
      // this.commands.disableTrackChanges();
      this.setEditable(true, false);
    }
  }

  /**
   * If we are replacing data and have a valid provider, listen for synced event
   * so that we can initialize the data
   */
  #initCollaboration() {
    if (!this.options.isNewFile || !this.options.collaborationProvider) return;

    const { collaborationProvider: provider } = this.options;
    if (provider.synced) this.#insertNewFileData();
    else {
      // If we are not sync'd yet, wait for the event then insert the data
      provider.once('synced', (isSynced) => {
        if (isSynced) this.#insertNewFileData();
      });
    }
  }

  /**
   * Replace the current document with new data.
   */
  #insertNewFileData() {
    const doc = this.#generatePmData();
    console.debug('[super-editor] Inserting new file data:', doc);
    const tr = this.state.tr.replaceWith(0, this.state.doc.content.size, doc);
    this.view.dispatch(tr);
  }

  #registerPluginByNameIfNotExists(name) {
    const plugin = this.extensionService?.plugins.find((p) => p.key.startsWith(name));
    const hasPlugin = this.state.plugins.find((p) => p.key.startsWith(name));
    if (plugin && !hasPlugin) this.registerPlugin(plugin);
    return plugin?.key;
  }

  /**
   * Set editor options and update state.
   * @param options List of options.
   */
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

  /**
   * Updates editable state.
   * @param editable Editable value.
   * @param emitUpdate Emit 'update' event or not.
   */
  setEditable(editable, emitUpdate = true) {
    this.setOptions({ editable });

    if (emitUpdate) {
      this.emit('update', { editor: this, transaction: this.state.tr });
    }
  }

  /**
   * Register PM plugin.
   * @param plugin PM plugin.
   * @param handlePlugins Optional function for handling plugin merge.
   */
  registerPlugin(plugin, handlePlugins) {
    const plugins = typeof handlePlugins === 'function' 
      ? handlePlugins(plugin, [...this.state.plugins])
      : [...this.state.plugins, plugin];

    const state = this.state.reconfigure({ plugins });
    this.view.updateState(state);
  }

  /**
   * Unregister PM plugin.
   * @param nameOrPluginKey Plugin name.
   */
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

  /**
   * Inject PM css styles.
   */
  #injectCSS() {
    if (this.options.injectCSS && document) {
      this.#css = createStyleTag(style);
    }
  }

  /**
   * Creates extension service.
   */
  #createExtensionService() {
    const allowedExtensions = ['extension', 'node', 'mark'];

    const coreExtensions = [
      Editable,
      Commands,
      EditorFocus,
      Keymap,
    ];
    const allExtensions = [
      ...coreExtensions, 
      ...this.options.extensions,
    ].filter((e) => allowedExtensions.includes(e?.type));

    this.extensionService = ExtensionService.create(allExtensions, this);
  }

  /**
   * Creates a command service.
   */
  #createCommandService() {
    this.#commandService = CommandService.create({
      editor: this,
    });
  }

  /**
   * Creates a SuperConverter.
   */
  #createConverter() {
    if (this.options.converter) {
      this.converter = this.options.converter;
    } else {
      this.converter = new SuperConverter({ 
        docx: this.options.content, 
        media: this.options.media,
        debug: true,
      });
    }
  }

  /**
   * Load the data from DOCX to be used in the schema.
   * Expects a DOCX file.
   */
  static async loadXmlData(fileSource) {
    if (!fileSource) return;

    const isFile = fileSource instanceof File;
    if (!isFile) {
      throw new Error('Content source must be a File object.');
    };

    const zipper = new DocxZipper();
    const xmlFiles = await zipper.getDocxData(fileSource);
    const mediaFiles = zipper.media;
    return [xmlFiles, mediaFiles];
  }

  /**
   * Creates PM schema.
   */
  #createSchema() {
    this.schema = this.extensionService.schema;
  }

  /**
   * Generate data from file
   */
  #generatePmData() {
    let doc;
    try {
      if (this.options.mode === 'docx') {
        doc = createDocument(
          this.converter,
          this.schema,
        );
      } else if (this.options.mode === 'text') {
        if (this.options.content) {
          doc = DOMParser.fromSchema(this.schema).parse(this.options.content);
        } else {
          doc = this.schema.topNodeType.createAndFill();
        }
      }
    } catch (err) {
      console.error(err);

      this.emit('contentError', {
        editor: this,
        error: err,
      });
    }
    return doc;
  }

  /**
   * Creates PM View.
   */
  #createView() {  
    const doc = this.#generatePmData();
    this.view = new EditorView(this.options.element, {
      ...this.options.editorProps,
      dispatchTransaction: this.#dispatchTransaction.bind(this),
      state: EditorState.create({
        doc,
      }),
    });

    const newState = this.state.reconfigure({
      plugins: this.extensionService.plugins,
    });

    this.view.updateState(newState);
    this.createNodeViews();

    const dom = this.view.dom;
    dom.editor = this;
  }
  
  /**
   * Creates all node views.
   */
  createNodeViews() {
    this.view.setProps({
      nodeViews: this.extensionService.nodeViews,
    });
  }

  /**
   * Initialize default styles for the editor container and prose mirror.
   * Get page size and margins from the converter.
   * Set document default font and font size.
   */
  #initDefaultStyles() {
    const proseMirror = this.element.querySelector('.ProseMirror');
    if (!proseMirror) return;

    const { pageSize, pageMargins } = this.converter.pageStyles ?? {};
    if (!pageSize || !pageMargins) return;

    this.element.style.boxSizing = 'border-box';
    this.element.style.width = pageSize.width + 'in';
    this.element.style.minWidth =  pageSize.width + 'in';
    this.element.style.maxWidth = pageSize.width + 'in';
    this.element.style.minHeight = pageSize.height + 'in';
    this.element.style.paddingTop = pageMargins.top + 'in';
    this.element.style.paddingRight = pageMargins.right + 'in';
    this.element.style.paddingBottom = pageMargins.bottom + 'in';
    this.element.style.paddingLeft = pageMargins.left + 'in';

    proseMirror.style.outline = 'none';
    proseMirror.style.border = 'none';
    proseMirror.style.padding = '0';
    proseMirror.style.margin = '0';
    proseMirror.style.width = '100%';
    proseMirror.style.paddingBottom = pageMargins.bottom + 'in';

    const { typeface, fontSizePt } = this.converter.getDocumentDefaultStyles() ?? {};
    if (!typeface || !fontSizePt) return;

    this.element.style.fontFamily = typeface;
    this.element.style.fontSize = fontSizePt + 'pt';
  }

  /**
   * The callback which is used to intercept View transactions.
   * @param {*} transaction State transaction.
   */
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

    const focus = transaction.getMeta('focus');
    if (focus) {
      this.emit('focus', {
        editor: this,
        event: focus.event,
        transaction,
      })
    }
    const blur = transaction.getMeta('blur');
    if (blur) {
      this.emit('blur', {
        editor: this,
        event: blur.event,
        transaction,
      })
    }

    if (!transaction.docChanged) {
      return;
    }

    this.emit('update', {
      editor: this,
      transaction,
    });
  }

  /**
   * Load the document comments.
   */
  #loadComments() {
    this.#comments = initComments(
      this,
      this.converter, 
      this.options.documentId,
    );

    this.emit('commentsLoaded', { comments: this.#comments });
  }

  getComment(id) {
    return this.#comments.find((c) => c.thread == id);
  }

  /**
   * Get attrs of the currently selected node or mark.
   * @example
   * editor.getAttributes('textStyle').color
   */
  getAttributes(nameOrType) {
    return Attribute.getAttributes(this.state, nameOrType);
  }

  /**
   * Returns if the currently selected node or mark is active.
   * @example
   * editor.isActive('bold')
   * editor.isActive('textStyle', { color: 'purple' })
   * editor.isActive({ textAlign: 'center' })
   */
  isActive(nameOrAttributes, attributesOrUndefined) {
    const name = typeof nameOrAttributes === 'string' ? nameOrAttributes : null;
    const attributes = typeof nameOrAttributes === 'string' ? attributesOrUndefined : nameOrAttributes;
    return isActive(this.state, name, attributes);
  }

  /**
   * Get the document as JSON.
   */
  getJSON() {
    return this.state.doc.toJSON();
  }

  /**
   * Get HTML string of the document
   */
  getHTML() {
    const div = document.createElement('div')
    const fragment = DOMSerializer
      .fromSchema(this.schema)
      .serializeFragment(this.state.doc.content)

    div.appendChild(fragment)
    return div.innerHTML
  }
  
  /**
   * Get page styles
   */
  getPageStyles() {
    return this.converter?.pageStyles;
  }

  /**
   * Export the editor document to DOCX.
   */
  async exportDocx() {
    const docx = this.converter.exportToDocx(this.getJSON());
    const relsData = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const rels = this.converter.schemaToXml(relsData);
    const docs = {
      'word/document.xml': String(docx),
      'word/_rels/document.xml.rels': String(rels),
    };

    const zipper = new DocxZipper();
    return await zipper.updateZip(this.options.fileSource, docs);
  }

  /**
   * Destroy the editor.
   */
  destroy() {
    this.emit('destroy');
    if (this.view) this.view.destroy();
    this.removeAllListeners();
  }
}
