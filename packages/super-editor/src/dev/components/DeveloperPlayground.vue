<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import BasicUpload from './BasicUpload.vue';
import BlankDOCX from '@common/data/blank.docx?url';

// Import the component the same you would in your app
import { SuperEditor, Toolbar } from '@/index';

let activeEditor = null;
const toolbarVisible = ref(false);

const toolbar = ref(null);
const currentFile = ref(null);
const DOC_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const handleNewFile = async (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  currentFile.value = await getFileObject(fileUrl);
}

const getFileObject = async (fileUrl) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: DOC_TYPE});
}

const commandsMap = {
  setFontSize: (args) => {
    let value = typeof args === 'object' ? args?.value : args;
    activeEditor.commands.setFontSize(value);
  },
  setFontFamily: (args) => {
    let value = args?.fontName;
    activeEditor.commands.setFontFamily(value);
  },
};

const handleToolbarCommand = ({ command, argument }) => {
  console.debug('[SuperEditor dev] Toolbar command', command, argument, activeEditor?.commands);

  const commands = activeEditor?.commands;
    if (!commands) {
    console.error('No commands');
    return;
  }

  const commandName = command;
  if (commandName in commands) {
    console.log('Executing command:', commandName);

    const command = commandsMap[commandName] 
      ? commandsMap[commandName] 
      : activeEditor.commands[commandName];

    command(argument);
    activeEditor.view.focus();
  } else {
    console.log('Command not found:', commandName);
  }    
};

const lastTransaction = ref(null);
const onUpdate = ({ editor, transaction }) => {
  console.debug('[SuperEditor dev] Document updated', editor);
  activeEditor = editor;

  lastTransaction.value = transaction;
}

const onSelectionUpdate = ({ editor, transaction }) => {
  const { from, to } = transaction.selection;
  // console.debug('[SuperEditor dev] Selection update', from, to);
  activeEditor = editor;

  // This logic should maybe be inside the Editor.js rather than here?
  const { selection } = editor.view.state;
  const selectionText = selection.$head.parent.textContent;
  const marks = selection.$head.marks();

  toolbar.value.onTextSelectionChange(marks, selectionText);
}

const onCreate = ({ editor }) => {
  console.debug('[Dev] Editor created', editor);
  activeEditor = editor;
  toolbarVisible.value = true;

  window.editor = editor;
  console.debug('[Dev] Page styles (pixels)', editor.getPageStyles());
  console.debug('[Dev] document styles', editor.converter.getDocumentDefaultStyles());

  Object.assign(editorStyles, editor.converter.getDocumentDefaultStyles());
}

const lastTransaction = ref(null);
const onUpdate = ({ editor, transaction }) => {
  console.debug('[SuperEditor dev] Document updated', editor);
  activeEditor = editor;

  lastTransaction.value = transaction;
}

const editorStyles = reactive({ });
const editorOptions = {
  onCreate,
  onSelectionUpdate,
  onUpdate
}

const exportDocx = async () => {
  const result = await activeEditor?.exportDocx();
  const blob = new Blob([result], { type: DOC_TYPE });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.docx';
  a.click();
}

onMounted(async () => {
  // set document to blank
  currentFile.value = await getFileObject(BlankDOCX);
})
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

      <div class="content-inner">
        <Toolbar
        v-if="toolbarVisible"
        :editor-instance="activeEditor"
        :update-transaction="lastTransaction"
        @command="handleToolbarCommand" ref="toolbar" />
        <!-- SuperEditor expects its data to be a URL --> 
        <SuperEditor
            mode="docx"
            documentId="ID-122"
            :file-source="currentFile" 
            :options="editorOptions" />
      </div>

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

.content-inner {
  width: 100%;
  max-width: 8.5in;
}
</style>
