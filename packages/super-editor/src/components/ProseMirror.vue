<script setup>
import { ref, onMounted } from 'vue';
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { history } from "prosemirror-history"

import { DocxSchema } from '@core/schema/DocxSchema';
import { initComments } from '@extensions/comments/comments';
import { buildKeymap } from '@core/shortcuts/buildKeymap';
import SuperConverter from '@core/SuperConverter';

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

const emit = defineEmits(['comments-loaded']);
const props = defineProps({
  mode: {
    type: String,
    default: 'text'
  },

  documentId: {
    type: String,
    required: false,
  },

  data: {
    type: Object,
  }
});

const editor = ref(null);
let editorView, editorState;
const loadedComments = ref([]);
const converter = new SuperConverter({ docx: props.data, debug: true });

// Document data
const documentData = ref(null);
const initData = () => {
  documentData.value = converter.getSchema();
  console.debug('\nSCHEMA', JSON.stringify(documentData.value, null, 2), '\n')
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
      buildKeymap(),
    ],
  });

  // Initialize the editor
  editorView = new EditorView(editor.value, {
    state: editorState,
    dispatchTransaction: handleTransaction,
  });

  const comments = initComments(editorView, converter, props.documentId);
  loadedComments.value = comments;

  // Let super doc know we have comments
  emit('comments-loaded', loadedComments.value);
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
