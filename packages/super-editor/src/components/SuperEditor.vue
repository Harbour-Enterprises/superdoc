<script setup>
import 'tippy.js/dist/tippy.css';
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@vue-3/index.js';
import { getStarterExtensions } from '@extensions/index.js';

const emit = defineEmits([
  'editor-ready',
  'comments-loaded',
  'selection-update'
]);

const props = defineProps({

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

const editor = shallowRef();
const editorElem = ref(null);

const initEditor = async () => {
  console.debug('[super-editor] Loading file...', props.fileSource);

  const [content, media] = await Editor.loadXmlData(props.fileSource);
  editor.value = new Editor({
    mode: 'docx',
    element: editorElem.value,
    fileSource: props.fileSource,
    extensions: getStarterExtensions(),
    documentId: props.documentId,
    content,
    media,
    users: [
      { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
      { name: 'Artem Nistuley', email: 'nick@harbourshare.com' },
      { name: 'Matthew Connelly', email: 'matthew@harbourshare.com' },
      { name: 'Eric Doversberger', email: 'eric@harbourshare.com'} 
    ],
    ...props.options,
  });
};

onMounted(() => {
  initEditor();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
});
</script>

<template>
  <div class="super-editor" v-if="props.fileSource">
    <div ref="editorElem" class="editor-element"></div>
  </div>
</template>

<style scoped>
.super-editor {
  display: inline-block;
  position: relative;
}
</style>
