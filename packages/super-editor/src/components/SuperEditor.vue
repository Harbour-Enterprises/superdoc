<script setup>
import { ref, onMounted } from 'vue';
import { Editor } from '@core/index.js';
import * as extensions from '@extensions/index.js';


const emit = defineEmits([
  'editor-ready',
  'comments-loaded',
  'selection-update'
]);

const props = defineProps({
  mode: {
    type: String,
    default: 'docx'
  },

  documentId: {
    type: String,
    required: false,
  },

  fileSource: {
    type: File,
    required: false,
  },

  options: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const editorElem = ref(null);

const initEditor = () => {
  console.debug('[super-editor] Loading file...', props.fileSource);
  const editor  = new Editor({
    element: editorElem.value,
    fileSource: props.fileSource,
    extensions: Object.values(extensions),
    documentId: props.documentId,
    ...props.options,
  });
};

onMounted(() => {
  initEditor();
});
</script>

<template>
  <div class="super-editor" v-if="props.fileSource">
    <div ref="editorElem" class="editor-element"></div>
  </div>
</template>

<style>
.ProseMirror {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}
.ProseMirror p {
  margin: 0 !important;
  padding: 0 !important;
}
</style>
<style scoped>
.editor-element {
  border: 1px solid #999;
}
</style>
