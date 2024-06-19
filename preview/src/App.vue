<script setup>
import { nextTick, ref } from 'vue';
import { BasicUpload } from 'super-editor';
import Superdoc from '@harbour-enterprises/superdoc';
import '@harbour-enterprises/superdoc/style.css';

const currentFile = ref(null);
const handleNewFile = (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  init(fileUrl);

  currentFile.value = fileUrl;
}

const init = (fileUrl) => {
  const config = {
    selector: '#superdoc',
    user: {
      name: 'Nick Bernal',
      email: 'nick@harbourshare.com',
    },
    documents: [
      {
        type: 'docx',
        data: fileUrl,
        id: '123',
      }
    ],
    modules: {
      'comments': {
        // readOnly: true,
        // allowResolve: false,
      },
      // 'hrbr-fields': {},
    }
  }
  const s = new Superdoc(config);
}

</script>

<template>
<div class="container">
  <div class="editor-wrapper">
    <div class="header">
      Upload a DOCX file to begin: <BasicUpload @file-change="handleNewFile"/>
    </div>

    <div class="main-content">
      <div id="superdoc"></div>
    </div>
  </div>
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
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  background-color: #0C286E;
  color: white;
  padding: 20px;
}
.editor-wrapper {
  min-width: 800px;
}
.main-content {
  padding: 20px;
}
.editor {
  min-width: 800px;
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>
