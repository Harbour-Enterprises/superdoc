<script setup>
import '@common/styles/common-styles.css';
import { nextTick, onMounted, ref } from 'vue';
import { Superdoc } from '@/index';
import { SuperEditor } from 'super-editor';
import { DOCX, PDF, HTML } from '@common/document-types';
import BasicUpload from '@common/components/BasicUpload.vue';
import BlankDOCX from '@common/data/blank.docx?url';

/* For local dev */
let activeEditor = null;
let superdoc = null;

const currentFile = ref(null);
const getFileObject = async (fileUrl, name, type) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], name, { type });
}

const handleNewFile = async (file) => {
  // Generate a file url
  const url = URL.createObjectURL(file);
  currentFile.value = await getFileObject(url, file.name, file.type);

  nextTick(() => {
    initializeApp();
  });
}

const initializeApp = async () => {
  const config = {
    selector: '#superdoc',
    toolbar: 'toolbar',
    user: {
      name: 'Super Document Jr.',
      email: 'user@harbourshare.com',
    },
    documents: [
      {
        data: currentFile.value,
        id: '123',
      },
    ],
    modules: {
      'comments': {
        // readOnly: true,
        // allowResolve: false,
      },
      'hrbr-fields': {},
    },
    users: [
      { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
      { name: 'Eric Doversberger', email: 'eric@harbourshare.com' },
    ]
  }
  superdoc = new Superdoc(config);
};

onMounted(async () => {
  handleNewFile(await getFileObject(BlankDOCX, 'blank_document.docx', DOCX));
});

</script>

<template>
  <div class="dev-app">

    <div class="header">
      <div class="left-side">
        <div class="title"><h2>🦋 SuperDoc Dev</h2></div>
        <div>
          Upload docx, pdf or (soon) html
          <BasicUpload @file-change="handleNewFile" />
        </div>
      </div>

    </div>

    <div id="toolbar" class="sd-toolbar"></div>

    <div class="content" v-if="currentFile">
      <div class="content-inner">
        <div id="superdoc"></div>
      </div>
    </div>
  </div>
</template>

<style>
.super-editor {
  border: none !important;
}
.sd-toolbar {
  min-width: 800px;
  width: 100%;
}
.superdoc .layers {
  cursor: text;
  background-color: white;
  border-radius: 16px;
  border: 1px solid #d3d3d3;
  text-align: left;
  box-shadow:0 0 5px hsla( 0,0%,0%,.05);
  transition: all 0.18s ease-out;
}
.superdoc .layers:hover {
  border: 1px solid #0160cc86;
  box-shadow:0 0 5px hsla( 0,0%,0%,.1);
}
.superdoc .layers:focus-within {
  border: 1px solid #015fcc;
  box-shadow:0 0 5px hsla( 0,0%,0%,.3 );
}
tr {
  height: 5px !important;
  padding: 0 !important;
  margin: 0 !important;
}
p {
  margin: 0 !important;
  padding: 0 !important;
}
</style>

<style scoped>
.dev-app {
  display: flex;
  flex-direction: column;
}
.header {
  background-color: rgb(222, 237, 243);
  display: flex;
  justify-content: space-between;
  padding: 20px;
  margin-bottom: 20px;
}
.left-side {
  display: flex;
  flex-direction: column;
}
.right-side {
  display: flex;
  align-items: flex-end;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.content-inner {
  width: 100%;
  max-width: 8.5in;
}

.dev-header {
  height: 50px;
  width: 100%;
  background-color: rgb(187, 188, 247);
}
.dev-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>