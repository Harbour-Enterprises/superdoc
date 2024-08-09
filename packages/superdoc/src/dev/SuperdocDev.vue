<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { Superdoc } from '@/index';
import { BasicUpload } from 'super-editor';
import BlankDOCX from '@common/data/blank.docx?url';

/* For local dev */
let activeEditor = null;
let superdoc = null;

const currentFile = ref(null);
const getFileObject = async (fileUrl) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const handleNewFile = async (file) => {
  // Generate a file url
  const url = URL.createObjectURL(file);
  currentFile.value = await getFileObject(url);

  nextTick(() => {
    initializeApp();
  });
}

const initializeApp = async () => {
  console.debug('[superdoc-dev] Loading file...', currentFile.value);
  const config = {
    selector: '#superdoc',
    toolbar: 'toolbar',
    user: {
      name: 'Nick Bernal',
      email: 'nick@harbourshare.com',
    },
    documents: [
      // {
      //   id: '456',
      //   type: 'pdf',
      //   data: pdfUrl,
      //   fields,
      //   annotations,
      //   conversations,
      // },
      {
        type: 'docx',
        data: currentFile.value,
        id: '123',
      },
      // {
      //   id: '789',
      //   type: 'pdf',
      //   data: fw4,
      // }
    ],
    modules: {
      // 'comments': {
      //   // readOnly: true,
      //   // allowResolve: false,
      // },
      // 'hrbr-fields': {},
    }
  }
  superdoc = new Superdoc(config);
};

onMounted(async () => {
  handleNewFile(await getFileObject(BlankDOCX));
});

const exportDocx = async () => {
  const result = await superdoc.activeEditor.exportDocx();
  const blob = new Blob([result], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.docx';
  a.click();
}
</script>

<template>
  <div class="dev-app">
    <div class="header">
      <div class="left-side">
        <div class="title">
          <h2>🦋 SuperDoc Dev</h2>
        </div>
        <div>
          Upload docx
          <BasicUpload @file-change="handleNewFile" />
        </div>
      </div>

      <div class="right-side">
        <button @click="exportDocx">Export</button>
      </div>
    </div>
    <div class="content" v-if="currentFile">

    <div class="content-inner">
      <div id="toolbar" style="min-width: 800px;"></div>

      <div id="superdoc"></div>
    </div>

    </div>
  </div>
</template>

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
.toolbar {
  display: flex;
}
</style>