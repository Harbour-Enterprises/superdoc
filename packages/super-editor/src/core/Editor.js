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

    const createDropdown = (trigger, items, editorView) => {
      const dropdownCtn = document.createElement("div")
      dropdownCtn.className = "toolbar-dropdown-ctn";

      const dropdownTrigger = document.createElement("div")
      dropdownTrigger.className = "toolbar-dropdown-trigger";
      dropdownTrigger.textContent = "Default"
      dropdownCtn.appendChild(dropdownTrigger)

      const dropdownOptions = document.createElement("div")
      dropdownOptions.className = "toolbar-dropdown-options";
      
      items.forEach(item => {
        const option = document.createElement("div")
        option.className = "toolbar-dropdown-option";
        option.appendChild(item.dom)
        dropdownOptions.appendChild(option)
        item.dom.addEventListener("click", e => {
          e.stopPropagation()
          item.command(editorView.state, editorView.dispatch, editorView)
          dropdownOptions.classList.toggle("visible")
        })
      })
      dropdownCtn.appendChild(dropdownOptions)

      // add event listener to trigger
      dropdownTrigger.addEventListener("click", e => {
        console.log("click")
        dropdownOptions.classList.toggle("visible")
      })

      return dropdownCtn
    }

    const separator = () => {
      let separator = document.createElement("div")
      separator.className = "separator"
      return separator
    }

    const button = (innerContent, name, classes=[]) => {
      let button = document.createElement("div")
      let buttonInner = document.createElement("span")
      buttonInner.textContent = innerContent
      button.appendChild(buttonInner)
      button.className = ["button", name, ...classes].join(" ")
      button.title = name
      return button
    }
    

    const addToolbar = (items) => {
      return new Plugin({
        view(editorView) {
          const toolbar = document.createElement('div');
          toolbar.className = 'super-editor-toolbar';
          editorView.dom.parentNode.prepend(toolbar);
          items.forEach((item) => {
            if (item.type === 'dropdown') {
              
              const button = item.dom;
              const options = item.options;
              console.log("options", options)

              const dropdown = createDropdown(button, options, editorView)

              toolbar.appendChild(dropdown)
              return;
            }

            if (item.type === 'separator') {
              const sep = item.dom;
              toolbar.appendChild(sep)
              return;
            }

            if (item.type === 'button') {
              const button = item.dom;
              button.style.cursor = "pointer"
              button.addEventListener("mousedown", e => {
                e.preventDefault()
                item.command(editorView.state, editorView.dispatch, editorView)
                editorView.focus()
              })
              toolbar.appendChild(button)
              return;
            }
          })

          return {
            update(view) {
              const marks = view.state.selection.$head.marks();
              const trigger = toolbar.querySelector(`.toolbar-dropdown-trigger`);
              const colorBtn = toolbar.querySelector(`.color`);
              // reset font dropdown
              trigger.innerText = "Default";
              trigger.classList.remove('active')

              // reset color button
              colorBtn.setAttribute("style", null)

              // get all buttons
              const buttons = toolbar.querySelectorAll('.button');
              // remove active class from all buttons
              buttons.forEach(button => button.classList.remove('active'));
              marks.forEach(mark => {
                const name = mark.type.name;
                if (name === "font") {
                  const currentFont = mark.attrs.fontName;
                  trigger.innerText = currentFont;
                  trigger.classList.add('active')
                  return;
                }
                if (name === "color") {
                  const currentStyleArray = mark.attrs.attributes.style;
                  const currentColorRule = currentStyleArray.find(i => i.startsWith("color"))
                  if (currentColorRule) {
                    colorBtn.setAttribute("style", currentColorRule)
                  }
                  return;
                }
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

    const setAttributes = (editorView, attrs, _mark=null) => {
      return () => {
      const mark = _mark || DocxSchema.marks.span.create({
        attributes: {...attrs}
      });
      const range = editorView.state.selection.ranges[0];

      const fromPos = range.$from.pos;
      const toPos = range.$to.pos;
      if (fromPos === toPos) return;

      const frag = editorView.state.doc.cut(fromPos, toPos)
      const firstChild = frag.content.firstChild || null;
      if (!firstChild) return;

      const content = frag.content.firstChild.textContent;
      const textNode = editorView.state.schema.text(content, [mark]);

      editorView.dispatch(
        editorView.state.tr.replaceSelectionWith(textNode, false)
      );
      }
    }
  
    const makeFontItem = (editorView, fontFamily, buttonText=null) => {
      const text = buttonText || fontFamily;
      const attributeDict = {
        fontName: fontFamily,
        attributes: {
          style: `font-family: ${fontFamily};`,
          fontName: fontFamily
        }
      }
      return {
        type: "button", 
        // command: setAttributes(editorView, {style: `font-family: ${fontFamily};`}), 
        command: toggleMark(DocxSchema.marks.font, attributeDict), 
        dom: button(text, text, ["option"])
      }
    }

    const makeStyleAttrs = (styleDict) => {
      const styleString = Object.entries(styleDict).map(([key, value]) => {return `${key}: ${value};`});
      return {
        attributes: {style: styleString}
      }
    }

    const items = [
      // font
      {type: "dropdown", options: [
        // {type: "button", command: setAttributes(this.view, {style: "font-family: courier;"}), dom: button("Courier", "font1", ["option"])},
        makeFontItem(this.view, "Courier"),
        makeFontItem(this.view, "Serif"),
        makeFontItem(this.view, "Sans-serif"),

      ], dom: button("A", "font")},

      // separator
      {type: "separator", dom: separator()},

      // font size
      {type: "button", command: toggleMark(DocxSchema.marks.span, makeStyleAttrs({"font-size": "2em"})), dom: button("+", "increase-size")},
      {type: "button", command: toggleMark(DocxSchema.marks.span, makeStyleAttrs({"font-size": ".5em"})), dom: button("-", "decrease-size")},

      // separator
      {type: "separator", dom: separator()},

      // bold
      {type: "button", command: toggleMark(DocxSchema.marks.strong), dom: button("B", "strong")},

      // italic
      {type: "button", command: toggleMark(DocxSchema.marks.em), dom: button("i", "em")},

      // underline
      {type: "button", command: toggleMark(DocxSchema.marks.underline), dom: button("u", "underline")},

      // text color
      // TODO
      {type: "button", command: toggleMark(DocxSchema.marks.color, makeStyleAttrs({color: "blue"})), dom: button("A", "color")},

      // separator
      {type: "separator", dom: separator()},

      // link
      // {type: "button", command: setAttributes(this.view, {href: "google.com"}, DocxSchema.marks.anchor), dom: button("link", "color")},
      {type: "button", command: toggleMark(DocxSchema.marks.anchor, {attributes: {href: 'https://google.com'}}), dom: button("link", "color")},
      
      // image
      {type: "button", command: toggleMark(DocxSchema.marks.em), dom: button("img", "color")},

      // separator  
      {type: "separator", dom: separator()},

      // paragraph

      // bullet list

      // ordered list

      // decrease indent

      // increase indent

      // overflow

      // suggesting

      // {type: "button", command: toggleMark(DocxSchema.marks.strikethrough), dom: button("s", "strikethrough")},

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
