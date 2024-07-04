<!-- 
  Dev app for the SuperEditor component

  The super-editor package exports SuperEditor directly. Thus, this app simulates the process
  of importing the component into another Vue 3 app (ie: superdoc) and using it.
-->

<script setup>
import { nextTick, ref } from 'vue';
import BasicUpload from './BasicUpload.vue';

// Import the component the same you would in your app
import { SuperEditor, Toolbar } from '@/index';

// For testing a file from URL
import sampleDocxUrl from '../../tests/fixtures/sample/sample.docx?url';


let activeEditor = null;

const toolbar = ref(null);
const currentFile = ref(null);
const handleNewFile = (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  nextTick(() => {
    currentFile.value = fileUrl;
  });
}

const handleToolbarCommand = (command) => {
  console.debug('[SuperEditor dev] Toolbar command', command, activeEditor?.commandService.commands);
  const commands = activeEditor?.commandService.commands;
  if (!!commands && command in commands){
    activeEditor?.commandService.commands[command]();
  }
}

const handleSelectionUpdate = ({ editor, transaction }) => {
  console.debug('[SuperEditor dev] Selection update');
  activeEditor = editor;
  toolbar.value.onSelectionChange({ editor, transaction })
}
</script>

<template>
  <div class="dev-app">
    <div class="header">
      <div class="title">
        <h2>Super Editor Dev Area</h2>
      </div>

      <!--
          A user using SuperEditor is expected to handle file uplodas and data sources on their own.
          SuperEditor just expects a URL to a docx file. This basic uploader is here for testing.
          You can also replace currentFile directly with a URL (ie: sampleDocxUrl).
      -->
      <div>
        Upload docx
        <BasicUpload @file-change="handleNewFile" />
      </div>
    </div>
    <div class="content" v-if="currentFile">

      <Toolbar @command="handleToolbarCommand" ref="toolbar" />

      <!-- SuperEditor expects its data to be a URL -->
      <SuperEditor
          mode="docx"
          documentId="ID-122"
          :data-url="currentFile" 
          @selection-update="handleSelectionUpdate" />

    </div>
  </div>
</template>

<style scoped>
.dev-app {
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  flex-direction: column;
  background-color: rgb(222, 237, 243);
  padding: 20px;
  margin-bottom: 20px;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
