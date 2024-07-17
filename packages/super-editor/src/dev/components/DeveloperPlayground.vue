<!-- 
  Dev app for the SuperEditor component

  The super-editor package exports SuperEditor directly. Thus, this app simulates the process
  of importing the component into another Vue 3 app (ie: superdoc) and using it.
-->

<script setup>
import { ref, reactive, computed } from 'vue';
import BasicUpload from './BasicUpload.vue';

// Import the component the same you would in your app
import { SuperEditor, Toolbar } from '@/index';

let activeEditor = null;
const toolbar = ref(null);
const currentFile = ref(null);
const handleNewFile = async (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  currentFile.value = new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const handleToolbarCommand = ({command, argument}) => {
    console.debug('[SuperEditor dev] Toolbar command', command, argument, activeEditor?.commands);
  const commands = activeEditor?.commands;
  if (!!commands && command in commands) {
    activeEditor?.commands[command](argument);
  }
}

const onSelectionUpdate = ({ editor, transaction }) => {
  const { from, to } = transaction.selection;
  console.debug('[SuperEditor dev] Selection update', from, to);
  activeEditor = editor;

  // This logic should maybe be inside the Editor.js rather than here?
  const { selection } = editor.view.state;
  const marks = selection.$head.marks();

  toolbar.value.onSelectionChange(marks);
}

const onCreate = ({ editor }) => {
  console.debug('[Dev] Editor created', editor);
  activeEditor = editor;
  window.editor = editor;
  console.debug('[Dev] Page styles (pixels)', editor.getPageStyles());
  console.debug('[Dev] document styles', editor.converter.getDocumentDefaultStyles());

  Object.assign(editorStyles, editor.converter.getDocumentDefaultStyles());
}

const editorStyles = reactive({ });
const editorOptions = {
  onCreate,
  onSelectionUpdate
}

const exportDocx = async () => {
  const result = await activeEditor?.exportDocx();
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

      <div class="right-side">
        <button @click="exportDocx">Export</button>
      </div>
    </div>
    <div class="content" v-if="currentFile">

      <Toolbar @command="handleToolbarCommand" ref="toolbar" />

      <!-- SuperEditor expects its data to be a URL -->
      <SuperEditor
          mode="docx"
          documentId="ID-122"
          :file-source="currentFile" 
          :options="editorOptions" />

    </div>
  </div>
</template>

<style>
.ProseMirror p {
  margin: 0;
  padding: 0;
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
</style>
