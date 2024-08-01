<script setup>
// import "super-editor/style.css";
import { Superdoc } from '@/index';
import docxWithComments from '../assets/sample.docx?url'
import { onMounted } from 'vue';


/* For local dev */
let activeEditor = null;
let superdoc = null;
const getFileObject = async () => {
  // Generate a file url
  const fileUrl = docxWithComments;
  const response = await fetch(docxWithComments);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const initializeApp = async () => {
  const docx = await getFileObject();
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
  superdoc.on('selection-update', ({ editor, transaction }) => {
    console.debug('[Superdoc] Selection update', editor, transaction);
    activeEditor = editor;
  });
}

const handleToolbarCommand = (command) => {
  console.debug('[SuperEditor dev] Toolbar command', command, activeEditor?.commands);
  const commands = activeEditor?.commands;
  if (!!commands && command in commands){
    activeEditor?.commands[command]();
  }
}

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