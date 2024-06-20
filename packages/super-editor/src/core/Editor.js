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

import { buildKeymap } from '@core/shortcuts/buildKeymap';
import { DocxSchema } from '@core/schema/DocxSchema';
import { SuperConverter } from '@core/SuperConverter';
import { EventEmitter } from './EventEmitter.js';
import { initComments as initCommentsExt } from '@extensions/comments/comments';

export class Editor extends EventEmitter {
  schema;

  view;

  options = {
    element: document.createElement('div'),
    content: '',
    editorProps: {},
    documentId: null,
    onCommentsLoaded: () => null,
  }

  constructor(options) {
    super();

    this.setOptions(options);
    this.#createSchema();
    this.#createConverter();
    this.#createView();

    this.on('comments-loaded', this.options.onCommentsLoaded);
    this.initComments();
  }

  get state() {
    return this.view.state;
  }

  get isDestroyed() {
    return !this.view?.docView;
  }

  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
    }

    if (!this.view || !this.state || this.isDestroyed) {
      return;
    }

    if (this.options.editorProps) {
      this.view.setProps(this.options.editorProps);
    }

    this.view.updateState(this.state);
  }

  #createConverter() {
    this.converter = new SuperConverter({ 
      docx: this.options.content, 
      debug: true,
    });
  }
  
  // TODO
  #createSchema() {
    this.schema = DocxSchema;
  }

  #createView() {
    let doc;
    
    try {
      const docData = this.converter.getSchema();
      console.debug('\nSCHEMA', JSON.stringify(docData, null, 2), '\n');
      if (docData) {
        doc = this.schema.nodeFromJSON(docData);
      } else {
        doc = this.schema.topNodeType.createAndFill();
      }
    } catch (err) {
      console.error(err);
    }

    this.view = new EditorView(this.options.element, {
      ...this.options.editorProps,
      dispatchTransaction: this.#dispatchTransaction.bind(this),
      state: EditorState.create({
        doc,
        plugins: [ // TODO
          history(),
          buildKeymap(),
        ],
      }),
    });
  }

  #dispatchTransaction(transaction) {
    const state = this.state.apply(transaction);

    this.view.updateState(state);
    this.emit('transaction', {
      editor: this,
      transaction,
    });
  }

  initComments() {
    const comments = initCommentsExt(
      this.view, 
      this.converter, 
      this.options.documentId,
    );
    this.emit('comments-loaded', { comments });
  }
  
  save() {
    console.debug('EDITOR CLASS SAVE - TODO', this.state.doc.toJSON());
    // const converter = new SuperConverter();
    console.debug('new converter', this.converter, this.converter.declaration)

    const xml = this.converter.schemaToXml({ doc: this.state.doc.toJSON() });
    console.debug('XML', xml);
  }
}
