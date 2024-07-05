<script setup>
import "super-editor/style.css";
import Superdoc from '@/index';
import docxWithComments from '../assets/lists_and_comments.docx?url'
import { onMounted } from 'vue';
import { Toolbar } from 'super-editor';


let activeEditor = null;

/* For local dev */
const initializeApp = async () => {
  const config = {
    selector: '#superdoc',
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
        data: docxWithComments,
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
  const superdoc = new Superdoc(config);  
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
</script>

<template>
  <div class="dev-container">

    <!-- Import the toolbar from the super editor -->
    <Toolbar class="toolbar" @command="handleToolbarCommand"/>

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