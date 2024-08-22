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
  const extensions = getStarterExtensions();

  // If collaboration is configured, add the extensions
  if (props.options.collaboration?.document && props.options.collaboration.provider) {
    initCollaboration();
    extensions.push(Collaboration);
    extensions.push(CollaborationCursor);
  }

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
    collaboration: {
      document: props.options.collaboration?.document,
      provider: props.options.collaboration?.provider,
    },
    ...props.options,
  });
};

onMounted(() => {
  console.debug('[super-editor] Mounted');
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
.ProseMirror > .ProseMirror-yjs-cursor:first-child {
  margin-top: 16px;
}
.ProseMirror p:first-child, .ProseMirror h1:first-child, .ProseMirror h2:first-child, .ProseMirror h3:first-child, .ProseMirror h4:first-child, .ProseMirror h5:first-child, .ProseMirror h6:first-child {
  margin-top: 16px
}
/* This gives the remote user caret. The colors are automatically overwritten*/
.ProseMirror-yjs-cursor {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid black;
  border-right: 1px solid black;
  border-color: orange;
  word-break: normal;
  pointer-events: none;
}
/* This renders the username above the caret */
.ProseMirror-yjs-cursor > div {
  position: absolute;
  top: -1.05em;
  left: -1px;
  font-size: 13px;
  background-color: rgb(250, 129, 0);
  font-family: serif;
  font-style: normal;
  font-weight: normal;
  line-height: normal;
  user-select: none;
  color: white;
  padding-left: 2px;
  padding-right: 2px;
  white-space: nowrap;
}
</style>
<style scoped>
.super-editor {
  position: relative;
}
</style>
