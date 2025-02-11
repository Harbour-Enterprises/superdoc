<script setup>
import '@harbour-enterprises/super-editor/style.css';
import '@harbour-enterprises/common/styles/common-styles.css';
import { onMounted, shallowRef, ref } from 'vue';
import { Editor, getStarterExtensions } from '@harbour-enterprises/super-editor';
import paginationTestDocx from '@testData/pagination1.docx?url';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const getFileObject = async (fileUrl, name, type) => {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], name, { type });
};

const editorDiv = ref(null);
const editor = shallowRef(null);

window.getPaginationState = async () => {
  const paginaton = editor.value.commands.getPaginationState();
  console.log(paginaton); 
  await new Promise((resolve) => setTimeout(resolve, 1000000));
  return editor.value.extensions;
  const paginationPlugin = editor.value.plugins.find((plugin) => plugin.name.startsWith('pagination'));
}

window.editorCommand = (cmd, params = null) => {
  return editor.value[cmd](params);
};

window.initTestApp = async (options = {}) => {
  editorDiv.value.innerHTML = '';
  const fileObject = await getFileObject(paginationTestDocx, 'testdoc.docx', DOCX);
  const [docx, media, mediaFiles, fonts] = await Editor.loadXmlData(fileObject, true);
  editor.value = new Editor({
    element: document.getElementById('editor'),
    content: docx,
    media,
    mediaFiles,
    fonts,
    pagination: true,
    extensions: getStarterExtensions(),
    ...options,
  });
};


</script>

<template>
  <div id="editor" ref="editorDiv">
    Initial content
  </div>
</template>

<style>
.super-editor {
  border: 1px solid black;
}
</style>