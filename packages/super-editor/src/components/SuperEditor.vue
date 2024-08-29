<script setup>
import 'tippy.js/dist/tippy.css';
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@vue-3/index.js';
import { getStarterExtensions } from '@extensions/index.js';
import { initializeApp } from 'firebase/app';
import { FirestoreProvider } from '@gmcfall/yjs-firestore-provider'
import * as Y from 'yjs';

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

const getFirebaseConfig = () => {
  return {
    apiKey: "AIzaSyCp2UcE6rd6fEARbFq24hySs5Thoa0LVfw",
    authDomain: "firestore-db-test-8db0d.firebaseapp.com",
    projectId: "firestore-db-test-8db0d",
    storageBucket: "firestore-db-test-8db0d.appspot.com",
    messagingSenderId: "439692670335",
    appId: "1:439692670335:web:53f3d91de63939eac3564a"
  };
}

// const initEditor = async () => {
//   console.debug('[super-editor] Loading file...', props.fileSource);

//   const app = initializeApp(getFirebaseConfig());
//   const documentId = props.documentId;
//   const documentPath = ['superdoc', 'tests', 'documents', documentId];
//   const ydoc = new Y.Doc();
//   const providerConfig = {
//     maxUpdatesPerBlob: 1,
//     maxUpdatePause: 250,
//   };
//   console.debug('[super-editor] Firestore provider', provider);

//   const [content, media] = await Editor.loadXmlData(props.fileSource);
//   editor.value = new Editor({
//     mode: 'docx',
//     element: editorElem.value,
//     fileSource: props.fileSource,
//     extensions: getStarterExtensions(),
//     documentId: props.documentId,
//     content, 
//     media,
//     collaboration: {
//       ydoc: ydoc,
//     },
//     users: [
//       { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
//       { name: 'Artem Nistuley', email: 'nick@harbourshare.com' },
//       { name: 'Matthew Connelly', email: 'matthew@harbourshare.com' },
//       { name: 'Eric Doversberger', email: 'eric@harbourshare.com'} 
//     ],
//     ...props.options,
//   });
// };

// const documentId = 'doc1'; //props.documentId;
// const documentPath = ['superdoc', 'tests', 'documents', documentId];
// const providerConfig = {
//   maxUpdatesPerBlob: 1,
//   maxUpdatePause: 250,
// };
// const app = initializeApp(getFirebaseConfig());
// const ydoc = new Y.Doc();
// const provider = new FirestoreProvider(app, ydoc, documentPath, providerConfig);

const initRemoteEditor = async () => {
  
  console.debug('\n\n\n[super-editor] Firestore provider', props.options.collaboration, '\n\n\n');

  const [content, media] = await Editor.loadXmlData(props.fileSource);
  editor.value = new Editor({
    mode: 'docx',
    isNewFile: props.options.isNewFile,
    element: editorElem.value,
    extensions: getStarterExtensions(),
    documentId: props.documentId,
    fileSource: props.fileSource,
    content, 
    media,
    collaboration: {
      provider: props.options.collaboration.provider,
      ydoc: props.options.collaboration.ydoc,
    },
    users: [
      { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
      { name: 'Artem Nistuley', email: 'nick@harbourshare.com' },
      { name: 'Matthew Connelly', email: 'matthew@harbourshare.com' },
      { name: 'Eric Doversberger', email: 'eric@harbourshare.com'} 
    ],
    ...props.options,
  });
}

onMounted(() => {
  console.debug('[super-editor] Mounted');
  const urlParams = new URLSearchParams(window.location.search);
  const remote = urlParams.get('remote');
  initRemoteEditor();
  // else initEditor();
});

onBeforeUnmount(() => {
  console.debug('[super-editor] Unmounted');
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
