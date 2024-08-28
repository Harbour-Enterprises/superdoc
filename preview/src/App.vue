<script setup>
import { nextTick, ref } from 'vue';
import { BasicUpload } from '@harbour-enterprises/super-editor';
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

let superdoc;
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
  superdoc = new Superdoc(config);
}

const save = () => {
  console.debug('Saving...');
  superdoc.saveAll();
}
</script>

<template>
<div class="container">
  <div class="editor-wrapper">
    <div class="header">
      <div>
        <h2 style="font-weight: 400;">Super Editor preview</h2>
        Upload a DOCX file to begin: <BasicUpload @file-change="handleNewFile"/>
      </div>

      <div style="display: flex; align-items: flex-end;">
        <!-- <button @click="save" class="save-button" v-if="currentFile">
          <i class="fal fa-file-download"></i>
          Save
        </button> -->
      </div>
    </div>

    <div class="main-content">
      <div id="superdoc"></div>
    </div>
  </div>
</div>
</template>

<style scoped>
.save-button {
  padding: 8px 14px;
  background-color: white;
  transition: all 250ms ease;
  outline: none;
  border: none;
  cursor: pointer;
}
.save-button:hover {
  background-color: #DBDBDB;
}
.save-button:active {
  background-color: #FFF;
}
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  background: linear-gradient(270deg, #0C286E 0%, #0C286E 70%, rgba(45,111,253,1) 140%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
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
