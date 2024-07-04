<script setup>
import { ref, onMounted } from 'vue';
import { Editor } from '@core/index.js';
import * as extensions from '@extensions/index.js';

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

const emit = defineEmits([
  'editor-ready',
  'comments-loaded',
  'selection-update'
]);

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
  },
});

const editorElem = ref(null);

const onCommentsLoaded = ({ comments }) => {
  // console.log({ comments });
  // Let super doc know we have comments
  emit('comments-loaded', comments);
};

const onSelectionUpdate = ({ editor, transaction }) => {
  emit('selection-update', { editor, transaction });
};

const initEditor = () => {
  const editor  = new Editor({
    element: editorElem.value,
    content: props.data,
    extensions: Object.values(extensions),
    documentId: props.documentId,
    onCommentsLoaded,
    onSelectionUpdate,
  });

  editor.on('create', ({ editor }) => {
    emit('editor-ready', props.documentId, editor);
  });
  
  editor.on('update', ({ editor, transaction }) => {
    console.log({ editor, transaction });
  });
};

onMounted(() => {
  initEditor();
});
</script>

<template>
  <div class="super-editor" v-if="props.data">
    <div ref="editorElem" class="editor"></div>
  </div>
</template>

<style scoped></style>
