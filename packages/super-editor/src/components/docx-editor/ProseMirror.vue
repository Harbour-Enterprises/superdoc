<script setup>
import { ref, onMounted } from 'vue';
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { history } from "prosemirror-history"

import { DocxSchema } from '@schemas/docx-schema';
import generateKeyMap from './keymap';
import SuperConverter from '@classes/super-converter';

// The editor needs to be agnostic to the data source
// It should be able to work with any DOCX, plain text, and HTML.
// This means, that we need to set certain flags for mode of operation
// And specify a schema.

// The editor can be collaborative / online, or single-user.
// This changes where the data comes from. This should likely be handled outside of this component.
// This also means this component needs to emit changes, for saving elsewhere.
// NOTE: How does this work with prose mirror version control/history?

// DOCX
// We will need all relevant data passed in. This includes multiple files from the docx zip.

const props = defineProps({
  mode: {
    type: String,
    default: 'text'
  },

  data: {
    type: Object,
  }
});

const editor = ref(null);
let editorView, editorState;

// Document data
const documentData = ref(null);
const initData = () => {
  const xml = props.data.find((f) => f.name === 'word/document.xml')?.content;
  if (!xml) return;

  const converter = new SuperConverter({ xml });
  documentData.value = converter.getSchema();
  console.debug('\nSCHEMA', documentData.value, '\n')
}

// Editor initialization
const handleTransaction = (transaction) => {
  console.debug('Transaction', transaction)
  const state = editorView.state.apply(transaction);
  editorView.updateState(state);
}

const getEditorData = () => {
  if (documentData.value) return DocxSchema.nodeFromJSON(documentData.value)
  return DocxSchema.topNodeType.createAndFill()
}

const initEditor = () => {
  // Initialize the document state, either from xmlDocument.value or blank
  editorState = EditorState.create({
    doc: getEditorData(),
    plugins: [
      history(),
      generateKeyMap(),
    ],        
  });

  // Initialize the editor
  editorView = new EditorView(editor.value, {
    state: editorState,
    dispatchTransaction: handleTransaction,
  });
};

onMounted(() => {
  if (props.data) initData();
  initEditor();
})
</script>

<template>
  <div class="super-editor" v-if="props.data">
    <div ref="editor" class="editor"></div>
  </div>
</template>

<style>
.super-editor .ProseMirror {
  min-height: 400px;
  border: 1px solid #999;
  border-radius: 8px;
  white-space: pre-wrap;
  color: black !important;
  padding: 20px;
  width: 600px;
}
.super-editor .ProseMirror > * {
  color: black;
  font-family: 'Arial', sans-serif;
  font-size: 12px !important;
}
</style>

<style scoped>
</style>
