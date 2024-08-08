<script setup>
// import "super-editor/style.css";
import { Superdoc } from '@/index';
// import docxWithComments from '../assets/sample.docx?url'
import { onMounted } from 'vue';
import BlankDOCX from '@common/data/blank.docx?url';

/* For local dev */
let activeEditor = null;
let superdoc = null;
const getFileObject = async (fileUrl) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const initializeApp = async () => {
  const docx = await getFileObject(BlankDOCX);
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
        data: docx,
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

onMounted(() => {
  initializeApp();
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
  <div class="dev-container">
    <button @click="exportDocx">export</button>

    <!-- Import the toolbar from the super editor -->
     <div id="toolbar" style="min-width: 800px;"></div>

    <!-- Render the document here -->
    <div id="superdoc"></div>

  </div>
</template>

<style scoped>
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