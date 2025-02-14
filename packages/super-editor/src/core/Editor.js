import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { EventEmitter } from './EventEmitter.js';
import { ExtensionService } from './ExtensionService.js';
import { CommandService } from './CommandService.js';
import { Attribute } from './Attribute.js';
import { SuperConverter } from '@core/super-converter/SuperConverter.js';
import { Commands, Keymap, Editable, EditorFocus } from './extensions/index.js';
import { createDocument } from './helpers/createDocument.js';
import { isActive } from './helpers/isActive.js';
import { initComments } from '@features/index.js';
import { trackedTransaction } from '@extensions/track-changes/trackChangesHelpers/trackedTransaction.js';
import { TrackChangesBasePluginKey } from '@extensions/track-changes/plugins/index.js';
import { initPaginationData, PaginationPluginKey } from '@extensions/pagination/pagination-helpers';
import { getNecessaryMigrations } from '@core/migrations/index.js';
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

  isFocused = false;

  #css;

  options = {
    element: null,
    isHeadless: false,
    mockDocument: null,
    mockWindow: null,
    content: '', // XML content
    user: null,
    users: [],
    media: {},
    mediaFiles: {},
    fonts: {},
    documentMode: 'editing',
    mode: 'docx',
    role: 'editor',
    colors: [],
    converter: null,
    fileSource: null,
    initialState: null,
    documentId: null,
    extensions: [],
    editable: true,
    editorProps: {},
    parseOptions: {},
    coreExtensionOptions: {},
    isNewFile: false,
    scale: 1,
    onBeforeCreate: () => null,
    onCreate: () => null,
    onUpdate: () => null,
    onSelectionUpdate: () => null,
    onTransaction: () => null,
    onFocus: () => null,
    onBlur: () => null,
    onDestroy: () => null,
    onContentError: ({ error }) => {
      throw error;
    },
    onTrackedChangesUpdate: () => null,
    onCommentsUpdate: () => null,
    onCommentsLoaded: () => null,
    onCommentClicked: () => null,
    onDocumentLocked: () => null,
    onFirstRender: () => null,
    onCollaborationReady: () => null,
    onException: () => null,
    // async (file) => url;
    handleImageUpload: null,
    
    // telemetry
    telemetry: null,
  };

  constructor(options) {
    super();

    options.element = options.isHeadless ? null : options.element || document.createElement('div');
    this.#checkHeadless(options);
    this.setOptions(options);

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
    this.#initMedia();

    this.on('beforeCreate', this.options.onBeforeCreate);
    this.emit('beforeCreate', { editor: this });
    this.on('contentError', this.options.onContentError);
    this.on('exception', this.options.onException);

    this.#createView();
    this.initDefaultStyles();
    this.setDocumentMode(options.documentMode);

    // If we are running headless, we can stop here
    if (this.options.isHeadless) return;

    this.on('create', this.options.onCreate);
    this.on('update', this.options.onUpdate);
    this.on('selectionUpdate', this.options.onSelectionUpdate);
    this.on('transaction', this.options.onTransaction);
    this.on('focus', this.#onFocus);
    this.on('blur', this.options.onBlur);
    this.on('destroy', this.options.onDestroy);
    this.on('trackedChangesUpdate', this.options.onTrackedChangesUpdate);
    this.on('commentsLoaded', this.options.onCommentsLoaded);
    this.on('commentClick', this.options.onCommentClicked);
    this.on('commentsUpdate', this.options.onCommentsUpdate);
    this.on('locked', this.options.onDocumentLocked);
    this.on('collaborationReady', this.#onCollaborationReady);

    this.#loadComments();
    this.initializeCollaborationData();

    // Init pagination only if we are not in collaborative mode. Otherwise
    // it will be in itialized via this.#onCollaborationReady
    if (!this.options.ydoc) this.#initPagination();

    window.setTimeout(() => {
      if (this.isDestroyed) return;
      this.emit('create', { editor: this });
    }, 0);
  }

  #initRichText(options) {
    this.#createExtensionService();
    this.#createCommandService();
    this.#createSchema();

    this.on('beforeCreate', this.options.onBeforeCreate);
    this.emit('beforeCreate', { editor: this });
    this.on('contentError', this.options.onContentError);

    this.#createView();

    this.on('create', this.options.onCreate);
    this.on('update', this.options.onUpdate);
    this.on('selectionUpdate', this.options.onSelectionUpdate);
    this.on('transaction', this.options.onTransaction);
    this.on('focus', this.#onFocus);
    this.on('blur', this.options.onBlur);
    this.on('destroy', this.options.onDestroy);
    this.on('commentsLoaded', this.options.onCommentsLoaded);
    this.on('commentClick', this.options.onCommentClicked);
    this.on('locked', this.options.onDocumentLocked);

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

  #checkHeadless(options) {
    if (!options.isHeadless) return;

    if (typeof navigator === 'undefined') {
      global.navigator = { isHeadless: true };
    }

    if (options.mockDocument) {
      global.document = options.mockDocument;
      global.window = options.mockWindow;
    }
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
    let cleanedMode = documentMode?.toLowerCase() || 'editing';
    if (!this.extensionService) return;

    if (this.options.role === 'viewer') cleanedMode = 'viewing';
    if (this.options.role === 'suggester' && cleanedMode === 'editing') cleanedMode = 'suggesting';
    // Viewing mode: Not editable, no tracked changes, no comments
    if (cleanedMode === 'viewing') {
      // this.unregisterPlugin('comments');
      this.commands.toggleTrackChangesShowOriginal();
      this.setEditable(false, false);
    }

    // Suggesting: Editable, tracked changes plugin enabled, comments
    else if (cleanedMode === 'suggesting') {
      // this.#registerPluginByNameIfNotExists('comments')
      this.#registerPluginByNameIfNotExists('TrackChangesBase');
      this.commands.disableTrackChangesShowOriginal();
      this.commands.enableTrackChanges();
      this.setEditable(true, false);
    }

    // Editing: Editable, tracked changes plguin disabled, comments
    else if (cleanedMode === 'editing') {
      this.#registerPluginByNameIfNotExists('TrackChangesBase');
      // this.#registerPluginByNameIfNotExists('comments');
      this.commands.disableTrackChangesShowOriginal();
      this.commands.disableTrackChanges();
      this.setEditable(true, false);
    }
  }

  /**
   * If we are replacing data and have a valid provider, listen for synced event
   * so that we can initialize the data
   */
  initializeCollaborationData() {
    const hasData = this.extensionService.extensions.find((e) => e.name === 'collaboration')
      ?.options.isReady;
    if (hasData) {
      setTimeout(() => {
        this.emit('collaborationReady', { editor: this, ydoc: this.options.ydoc });
      }, 150);
    }

    if (!this.options.isNewFile || !this.options.collaborationProvider) return;
    const { collaborationProvider: provider } = this.options;

    const postSyncInit = () => {
      provider.off('synced', postSyncInit);
      this.#insertNewFileData();
    };

    if (provider.synced) this.#insertNewFileData();
    // If we are not sync'd yet, wait for the event then insert the data
    else provider.on('synced', postSyncInit);
  }

  /**
   * Replace the current document with new data. Necessary for initializing a new collaboration file,
   * since we need to insert the data only after the provider has synced.
   */
  #insertNewFileData() {
    if (!this.options.isNewFile) return;
    this.options.isNewFile = false;
    const doc = this.#generatePmData();
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
    const plugins =
      typeof handlePlugins === 'function'
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
    if (this.isDestroyed) return;

    const name = typeof nameOrPluginKey === 'string' ? `${nameOrPluginKey}$` : nameOrPluginKey.key;

    const state = this.state.reconfigure({
      plugins: this.state.plugins.filter((plugin) => !plugin.key.startsWith(name)),
    });

    this.view.updateState(state);
  }

  /**
   * Creates extension service.
   */
  #createExtensionService() {
    const allowedExtensions = ['extension', 'node', 'mark'];

    const coreExtensions = [Editable, Commands, EditorFocus, Keymap];

    const allExtensions = [...coreExtensions, ...this.options.extensions].filter((e) =>
      allowedExtensions.includes(e?.type),
    );

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
        media: this.options.mediaFiles,
        debug: true,
        telemetry: this.options.telemetry,
        fileSource: this.options.fileSource,
        documentId: this.options.documentId,
      });
    }
  }

  /**
   * Initialize media.
   */
  #initMedia() {
    if (!this.options.ydoc) return (this.storage.image.media = this.options.mediaFiles);

    const mediaMap = this.options.ydoc.getMap('media');

    // We are creating a new file and need to set the media
    if (this.options.isNewFile) {
      Object.entries(this.options.mediaFiles).forEach(([key, value]) => {
        mediaMap.set(key, value);
      });

      // Set the storage to the imported media files
      this.storage.image.media = this.options.mediaFiles;
    }

    // If we are opening an existing file, we need to get the media from the ydoc
    else {
      this.storage.image.media = Object.fromEntries(mediaMap.entries());
    }
  }

  /**
   * Load the data from DOCX to be used in the schema.
   * Expects a DOCX file.
   */
  static async loadXmlData(fileSource) {
    if (!fileSource) return;

    const zipper = new DocxZipper();
    const xmlFiles = await zipper.getDocxData(fileSource);
    const mediaFiles = zipper.media;

    return [xmlFiles, mediaFiles, zipper.mediaFiles, zipper.fonts];
  }

  static getDocumentVersion(content) {
    const version = SuperConverter.getStoredSuperdocVersion(content);
    return version;
  };

  static updateDocumentVersion(content, version) {
    const updatedContent = SuperConverter.updateDocumentVersion(content, version);
    return updatedContent;
  };

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
      const { mode, fragment, isHeadless, content, loadFromSchema } = this.options;
      
      if (mode === 'docx') {
        doc = createDocument(this.converter, this.schema, this);
  
        if (fragment && isHeadless) {
          doc = yXmlFragmentToProseMirrorRootNode(fragment, this.schema);
        }
      } else if (mode === 'text') {
        if (content) {
          doc = loadFromSchema
            ? this.schema.nodeFromJSON(content)
            : DOMParser.fromSchema(this.schema).parse(content);
        } else {
          doc = this.schema.topNodeType.createAndFill();
        }
      }
    } catch (err) {
      console.error(err);
      this.emit('contentError', { editor: this, error: err });
    }
  
    return doc;
  }

  /**
   * Creates PM View.
   */
  #createView() {
    let doc = this.#generatePmData();
    console.debug('\n\n DOC', doc, '\n\n')

    // Only initialize the doc if we are not using Yjs/collaboration
    const state = { schema: this.schema };
    if (!this.options.ydoc) state.doc = doc;

    this.view = new EditorView(this.options.element, {
      ...this.options.editorProps,
      dispatchTransaction: this.#dispatchTransaction.bind(this),
      state: EditorState.create(state),
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

  getMaxContentSize() {
    const { pageSize = {}, pageMargins = {} } = this.converter.pageStyles ?? {};
    const { width, height } = pageSize;
    const { top = 0, bottom = 0, left = 0, right = 0 } = pageMargins;

    // All sizes are in inches so we multiply by 96 to get pixels
    if (!width || !height) return {};

    const maxHeight = height * 96 - top * 96 - bottom * 96 - 50;
    const maxWidth = width * 96 - left * 96 - right * 96 - 20;
    return {
      width: maxWidth,
      height: maxHeight,
    }
  }

  /**
   * Initialize default styles for the editor container and ProseMirror.
   * Get page size and margins from the converter.
   * Set document default font and font size.
   */
  initDefaultStyles(element = this.element) {
    if (this.options.isHeadless) return;

    const proseMirror = element?.querySelector('.ProseMirror');
    const { pageSize, pageMargins } = this.converter.pageStyles ?? {};

    if (!proseMirror || !pageSize || !pageMargins) {
      return;
    }

    // Set fixed dimensions and padding that won't change with scaling
    element.style.width = pageSize.width + 'in';
    element.style.minWidth = pageSize.width + 'in';
    element.style.minHeight = pageSize.height + 'in';
    element.style.paddingLeft = pageMargins.left + 'in';
    element.style.paddingRight = pageMargins.right + 'in';
    element.style.boxSizing = 'border-box';

    proseMirror.style.outline = 'none';
    proseMirror.style.border = 'none';

    // Typeface and font size
    const { typeface, fontSizePt } = this.converter.getDocumentDefaultStyles() ?? {};

    if (typeface) {
      element.style.fontFamily = typeface;
    }
    if (fontSizePt) {
      element.style.fontSize = `${fontSizePt}pt`;
    }

    // Mobile styles
    element.style.transformOrigin = 'top left';
    element.style.touchAction = 'auto';
    element.style.webkitOverflowScrolling = 'touch';

    // Calculate line height
    const defaultLineHeight = 1.15;
    proseMirror.style.lineHeight = defaultLineHeight;

    // If we are not using pagination, we still need to add some padding for header/footer
    if (!this.options.extensions.find((e) => e.name === 'pagination')) {
      proseMirror.style.paddingTop = '1in';
      proseMirror.style.paddingBottom = '1in';
    }

    this.initMobileStyles(element);
  };

  initMobileStyles(element) {
    if (!element) {
      return;
    }

    const initialWidth = element.offsetWidth;
    
    const updateScale = () => {
      const elementWidth = initialWidth;
      const availableWidth = document.documentElement.clientWidth;
      
      this.options.scale = Math.min(1, availableWidth / elementWidth);

      const superEditorElement = element.closest('.super-editor');
      const superEditorContainer = element.closest('.super-editor-container');

      if (!superEditorElement || !superEditorContainer) {
        return;
      }

      if (this.options.scale < 1) {
        superEditorElement.style.maxWidth = `${elementWidth * this.options.scale}px`;
        superEditorContainer.style.minWidth = '0px';

        element.style.transform = `scale(${this.options.scale})`;
      } else {
        superEditorElement.style.maxWidth = '';
        superEditorContainer.style.minWidth = '';

        element.style.transform = "none"; 
      }
    };

    // Initial scale
    updateScale();

    // Update scale on window orientation change
    screen.orientation.addEventListener('change', () => {
      setTimeout(() => {
        updateScale();
      }, 150);
    });
  };

  #onCollaborationReady({ editor, ydoc }) {
    if (this.options.collaborationIsReady) return;
    console.debug('🔗 [super-editor] Collaboration ready');
    this.options.onCollaborationReady({ editor, ydoc });
    this.options.collaborationIsReady = true;
    this.#initPagination();
  }

  /**
   * Initialize pagination, if the pagination extension is enabled.
   */
  async #initPagination() {
    if (this.options.isHeadless || !this.extensionService) return;

    const pagination = this.options.extensions.find((e) => e.name === 'pagination');
    if (pagination && this.options.pagination) {
      console.debug('🔗 [super-editor] Initializing pagination');
      const sectionData = await initPaginationData(this);
      this.storage.pagination.sectionData = sectionData;

      // Trigger transaction to initialize pagination
      const { state, dispatch } = this.view;
      const tr = state.tr.setMeta(PaginationPluginKey, { isReadyToInit: true });
      dispatch(tr);
    }
  }

  /**
   * The callback which is used to intercept View transactions.
   * @param {*} transaction State transaction.
   */
  #dispatchTransaction(transaction) {
    if (this.view.isDestroyed) return;

    let state;
    try {
      const trackChangesState = TrackChangesBasePluginKey.getState(this.view.state);
      const isTrackChangesActive = trackChangesState?.isTrackChangesActive ?? false;

      const tr = isTrackChangesActive
        ? trackedTransaction({
            tr: transaction,
            state: this.state,
            user: this.options.user,
          })
        : transaction;

      const { state: newState } = this.view.state.applyTransaction(tr);
      state = newState;
    } catch (error) {
      // just in case
      state = this.state.apply(transaction);
      console.log(error);
    }

    const selectionHasChanged = !this.state.selection.eq(state.selection);
    this.view.updateState(state);

    this.emit('transaction', {
      editor: this,
      transaction,
    });

    if (selectionHasChanged) {
      this.emit('selectionUpdate', {
        editor: this,
        transaction,
      });
    }

    const focus = transaction.getMeta('focus');
    if (focus) {
      this.emit('focus', {
        editor: this,
        event: focus.event,
        transaction,
      });
    }

    const blur = transaction.getMeta('blur');
    if (blur) {
      this.emit('blur', {
        editor: this,
        event: blur.event,
        transaction,
      });
    }

    this.toolbar?.updateToolbarState();
    
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
    if (!this.converter.comments) return;
    this.emit('commentsLoaded', { editor: this, comments: this.converter.comments });
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
    const attributes =
      typeof nameOrAttributes === 'string' ? attributesOrUndefined : nameOrAttributes;
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
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(this.schema).serializeFragment(this.state.doc.content);

    div.appendChild(fragment);
    return div.innerHTML;
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
  async exportDocx({ isFinalDoc = false, comments = [] } = {}) {
    const json = this.getJSON();
    const documentXml = await this.converter.exportToDocx(
      json,
      this.schema,
      this.storage.image.media,
      isFinalDoc,
      comments,
    );

    const relsData = this.converter.convertedXml['word/_rels/document.xml.rels'];
    const rels = this.converter.schemaToXml(relsData.elements[0]);
    const customXml = this.converter.schemaToXml(this.converter.convertedXml['docProps/custom.xml'].elements[0]);
    const customSettings = this.converter.schemaToXml(this.converter.convertedXml['word/settings.xml'].elements[0]);
    const commentsXml = this.converter.schemaToXml(this.converter.convertedXml['word/comments.xml'].elements[0]);
    const media = this.converter.addedMedia;

    const updatedDocs = {
      'word/document.xml': String(documentXml),
      'word/_rels/document.xml.rels': String(rels),
      'docProps/custom.xml': String(customXml),
      'word/settings.xml': String(customSettings),
      'word/comments.xml': String(commentsXml),
    };

    const zipper = new DocxZipper();
    const result = await zipper.updateZip({
      docx: this.options.content,
      updatedDocs: updatedDocs,
      originalDocxFile: this.options.fileSource,
      media,
      fonts: this.options.fonts,
      isHeadless: this.options.isHeadless,
    });

    this.telemetry?.trackUsage('document_export', {
      documentType: 'docx',
      timestamp: new Date().toISOString()
    });

    return result;
  }

  /**
   * Destroy collaboration provider and ydoc
   */
  #endCollaboration() {
    try {
      if (this.options.collaborationProvider) this.options.collaborationProvider.disconnect();
      if (this.options.ydoc) this.options.ydoc.destroy();
    } catch (error) {}
  }

  /**
   * Destroy the editor.
   */
  destroy() {
    this.emit('destroy');
    if (this.view) this.view.destroy();
    this.#endCollaboration();
    this.removeAllListeners();
  }

  static checkIfMigrationsNeeded(version) {
    if (!version) version = 'initial';
    const migrations = getNecessaryMigrations(version) || [];
    console.debug('[checkVersionMigrations] Migrations needed:', version, migrations.length);
    return migrations.length > 0;
  }

  /**
   * Check for any necessary document migrations in collaboration mode
   * 
   * @returns {Y.Doc | undefined} Updated Y.Doc if any, otherwise undefined
   */
  processCollaborationMigrations() {
    console.debug('[checkVersionMigrations] Current editor version', __APP_VERSION__);
    if (!this.options.ydoc) return;

    const metaMap = this.options.ydoc.getMap('meta');
    let docVersion = metaMap.get('version');
    if (!docVersion) docVersion = 'initial';
    console.debug('[checkVersionMigrations] Document version', docVersion);
    const migrations = getNecessaryMigrations(docVersion) || [];

    const plugins = this.state.plugins;
    const syncPlugin = plugins.find((p) => p.key.startsWith('y-sync'));
    if (!syncPlugin) return this.options.ydoc;

    let hasRunMigrations = false;
    for (let migration of migrations) {
      console.debug('🏃‍♂️ Running migration', migration.name);
      const result = migration(this);
      if (!result) throw new Error('Migration failed at ' + migration.name);
      else hasRunMigrations = true;
    };

    // If no migrations were run, return undefined (no updated ydoc).
    if (!hasRunMigrations) return;

    // Return the updated ydoc
    const pluginState = syncPlugin?.getState(this.state);
    return pluginState.doc;
  };

}
