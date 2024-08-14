<script setup>
import '@common/styles/common-styles.css';
import { ref, reactive, watch, onMounted } from 'vue';
import BasicUpload from './BasicUpload.vue';
import BlankDOCX from '@common/data/blank.docx?url';
import { makeDefaultItems, setHistoryButtonStateOnUpdate } from '@components/toolbar/defaultItems.js';
import EditorInputs from './EditorInputs/EditorInputs.vue';
import { INPUTS } from '../config/agreement-editor.js';

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


const closeOpenDropdowns = (currentItem) => {
  const parentToolbarItems = toolbarItems.value.filter(item => item.childItem);
  parentToolbarItems.forEach((item) => {
    if (currentItem) {
      if (item.name === currentItem.name) return;
      if (item.childItem && item.childItem.name === currentItem.name) return;
    }
    item.active = false;
    item.childItem.active = false;
    item.inlineTextInputVisible = false;
  });
}

const handleToolbarCommand = ({ item, argument }) => {
  if (!item) return;
  closeOpenDropdowns(item);

  const { command } = item;

  item.preCommand(argument);

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

const onSelectionUpdate = ({ editor, transaction }) => {
  closeOpenDropdowns();

  const { from, to } = transaction.selection;
  activeEditor = editor;
  toolbarItems.value.forEach((item) => {
    item.editor = editor;
  })

  // This logic should maybe be inside the Editor.js rather than here?
  const { selection } = editor.view.state;
  const selectionText = selection.$head.parent.textContent;
  const marks = selection.$head.marks();
  const nodes = selection.$head.node();
  const coords = editor.view.coordsAtPos(selection.$head.pos);

  toolbar.value.onTextSelectionChange(marks, selectionText, coords);
}

const toolbarItems = ref([]);

const onCreate = ({ editor }) => {
  console.debug('[Dev] Editor created', editor);
  activeEditor = editor;
  toolbarVisible.value = true;
  toolbarItems.value = makeDefaultItems(activeEditor);

  window.editor = editor;
  console.debug('[Dev] Page styles (pixels)', editor.getPageStyles());
  console.debug('[Dev] document styles', editor.converter.getDocumentDefaultStyles());

  toolbarItems.value.forEach((item) => {
    item.editor = editor;
  })

  Object.assign(editorStyles, editor.converter.getDocumentDefaultStyles());
}

const onCommentClicked = ({ conversation }) => {
  console.debug('💬 [Dev] Comment active', conversation);
};

const editorStyles = reactive({});
const editorOptions = {
    onCreate,
    onSelectionUpdate,
    onUpdate: setHistoryButtonStateOnUpdate(toolbarItems),
    onCommentClicked
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

const handleToolbarButtonClick = ({item, argument}) => {
  executeItemCommands(item, argument);
}

/* Inputs pane */
const inputTiles = INPUTS;
const draggedInputId = ref(null)
const activeSigner = ref(null);
const signersListInfo = ref([
  {
    signerindex: 0,
    signername: "Signer 1",
    signeremail: "signer1@harbourshare.com",
    isactive: true,
    signercolor: "#016c59",
    iselementvisible: true,
    signeriseditable: true,
    sortorder: 0,
    signerid: "signerid-1723657655732-7x1vne6lq1r",
    iscreator: false
  },
  {
    signerindex: 1,
    signername: "Signer 2",
    signeremail: "signer2@harbourshare.com",
    isactive: true,
    signercolor: "#6943d0",
    iselementvisible: true,
    signeriseditable: true,
    sortorder: 1,
    signerid: "signerid-1723657671736-msk8e5qpd0c",
    iscreator: false
  }
]);

const updateDraggedInputId = (inputId) => {
  draggedInputId.value = inputId;
  
  let inputItem = inputTiles.find((i) => i.id === inputId);
  let signer = signersListInfo.value.find((i) => i.signerindex === activeSigner.value);
  console.log({ inputItem, signer });
};

const updateActiveSigner = (signerIdx) => {
  activeSigner.value = signerIdx;
};
/* Inputs pane */

onMounted(async () => {
  // set document to blank
  currentFile.value = await getFileObject(BlankDOCX);
});
</script>

<template>
  <div class="dev-app">
    <div class="dev-app__layout">

      <div class="dev-app__header">
        <div class="dev-app__header-side dev-app__header-side--left">
          <div class="dev-app__header-title">
            <h2>Super Editor Dev Area</h2>
          </div>
          <div class="dev-app__header-upload">
            Upload docx
            <BasicUpload @file-change="handleNewFile" />
          </div>
        </div>
        <div class="dev-app__header-side dev-app__header-side--right">
          <button class="dev-app__header-export-btn" @click="exportDocx">Export</button>
        </div>
      </div>

      <div class="dev-app__main">
        <div class="dev-app__inputs-panel">
          <div class="dev-app__inputs-panel-content">
            <EditorInputs
              v-bind="{ activeSigner, signersListInfo }" 
              @dragged-input-id-change="updateDraggedInputId"
              @active-signer-change="updateActiveSigner"
            />
          </div>
        </div>

        <div class="dev-app__view">
            <div class="dev-app__content" v-if="currentFile">
              <div class="dev-app__content-container">
                <Toolbar
                  v-if="toolbarVisible"
                  :toolbar-items="toolbarItems"
                  :editor-instance="activeEditor"
                  @buttonclick="handleToolbarButtonClick"
                  @command="handleToolbarCommand" 
                  ref="toolbar"
                />
                <SuperEditor
                  mode="docx"
                  documentId="ID-122"
                  :file-source="currentFile" 
                  :options="editorOptions" 
                />
              </div>
            </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
*,
::before,
::after {
  box-sizing: border-box;
}

.ProseMirror p {
  margin: 0;
  padding: 0;
}
.comment-highlight {
  background-color: red;
}
</style>

<style scoped>
.dev-app {
  --header-height: 148px;

  width: 100%;
  height: 100vh;
}

.dev-app__layout {
  display: grid;
  grid-template-rows: var(--header-height) 1fr; /* 1fr */
  width: 100%;
  height: 100vh;
}

.dev-app__header {
  display: flex;
  justify-content: space-between;
  background-color: rgb(222, 237, 243);
  padding: 20px;
}

.dev-app__header-side {
  display: flex;
}
.dev-app__header-side--left {
  flex-direction: column;
}
.dev-app__header-side--right {
  align-items: flex-end;
}

.dev-app__main {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr) 340px;
  overflow-y: auto;
}

.dev-app__view {
  display: flex;
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
  overflow-y: auto;
}

.dev-app__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.dev-app__content-container {
  width: 100%;
  max-width: 8.5in;
}

.dev-app__inputs-panel {
  display: grid;
  height: calc(100vh - var(--header-height));
  background: #fff;
  border-right: 1px solid #dbdbdb;
}

.dev-app__inputs-panel-content {
  display: grid;
  overflow-y: auto;
  scrollbar-width: none;
}
</style>
