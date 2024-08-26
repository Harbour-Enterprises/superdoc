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

<style>
.popover {
  background-color: #fff;
  border-radius: 8px;
  -webkit-box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  -moz-box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  padding: 0;
  width: auto;
  height: auto;
  font-size: 14px;
  color: #333;
  z-index: 1000;
}

.popover-header {
  font-weight: bold;
  margin-bottom: 8px;
}

.tippy-content {
  padding: 0;
}

.tippy-box[data-theme~='popover'] {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  border: none;
}

.tippy-box[data-theme~='popover'] .tippy-arrow {
  color: #fff;
  border: 1px solid #DBDBDB;
}

.tippy-box[data-theme~='popover'] {
  border: none !important;
  padding: none !important;
}
.super-editor-placeholder::before {
  content: attr(data-placeholder);
  color: #aaa;
  pointer-events: none;
  display: block;
  height: 0;
}

.superdoc-at-mention {
  background-color: #1355FF15;
  color: #222;
  font-weight: 400;
  border-radius: 3px;
  padding: 0 5px;
  cursor: default;
  display: inline-block;
}
</style>

<style scoped>
.super-editor {
  border: 1px solid #999;
  position: relative;
}
</style>
