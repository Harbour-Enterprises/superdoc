<script setup>
import '@harbour-enterprises/common/styles/common-styles.css';
import '@harbour-enterprises/common/icons/icons.css';
import { ref, computed, onMounted } from 'vue';

import { SuperEditor } from '@/index';
import { getFileObject } from '@harbour-enterprises/common/helpers/get-file-object';
import { DOCX } from '@harbour-enterprises/common';
import { INPUTS } from '../config/agreement-editor.js';
import { SuperToolbar } from '@components/toolbar/super-toolbar';
import { fieldAnnotationHelpers } from '@extensions/index.js';
import BasicUpload from './BasicUpload.vue';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';
import EditorInputs from './EditorInputs/EditorInputs.vue';

// Import the component the same you would in your app
let activeEditor;
const currentFile = ref(null);

const handleNewFile = async (file) => {
  currentFile.value = null;
  const fileUrl = URL.createObjectURL(file);
  currentFile.value = await getFileObject(fileUrl, file.name, file.type);
};

const onCreate = ({ editor }) => {
  console.debug('[Dev] Editor created', editor);
  console.debug('[Dev] Page styles (pixels)', editor.getPageStyles());
  console.debug('[Dev] document styles', editor.converter?.getDocumentDefaultStyles());

  activeEditor = editor;
  window.editor = editor;

  editor.setToolbar(initToolbar());
  editor.toolbar.on('superdoc-command', ({ item, argument }) => {
    const { command } = item;
    if (command === 'setDocumentMode') {
      editor.setDocumentMode(argument);
    }
  });
  attachAnnotationEventHandlers();
};

const onCommentClicked = ({ conversation }) => {
  console.debug('💬 [Dev] Comment active', conversation);
};

const user = {
  name: 'Developer playground',
  email: 'devs@harbourshare.com',
};

const editorOptions = computed(() => {
  return {
    documentId: 'dev-123',
    user,
    onCreate,
    onCommentClicked,
    suppressSkeletonLoader: true,
    users: [], // For comment @-mentions, only users that have access to the document
  }
});

const exportDocx = async () => {
  const result = await activeEditor?.exportDocx();
  const blob = new Blob([result], { type: DOCX });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.docx';
  a.click();
};

/* Inputs pane and field annotations */
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
  },
]);

const updateDraggedInputId = (inputId) => {
  draggedInputId.value = inputId;
};

const updateActiveSigner = (signerIdx) => {
  activeSigner.value = signerIdx;
};

const attachAnnotationEventHandlers = () => {
  // Handle field drop outside editor.
  activeEditor?.on('fieldAnnotationDropped', ({ 
    sourceField,
    editor, 
    coordinates, 
    pos 
  }) => {
    console.log('fieldAnnotationDropped', { sourceField });

    let signer = signersListInfo.value.find((signer) => signer.signerindex === activeSigner.value);

    editor.commands.addFieldAnnotation(pos, {
      displayLabel: 'Enter your info',
      fieldId: `agreementinput-${Date.now()}-${Math.floor(Math.random() * 1000000000000)}`,
      // fieldId: `222`,
      fieldType: 'TEXTINPUT',
      fieldColor: signer?.signercolor,
    });

    // To test link field.
    // editor.commands.addFieldAnnotation(pos, {
    //   displayLabel: 'Enter your link',
    //   fieldId: `agreementinput-${Date.now()}-${Math.floor(Math.random() * 1000000000000)}`,
    //   fieldType: 'URLTEXTINPUT',
    //   fieldColor: signer?.signercolor,
    //   linkUrl: 'https://google.com',
    //   type: 'link',
    // });
  });

  activeEditor?.on('fieldAnnotationClicked', (params) => {
    console.log('fieldAnnotationClicked', { params });
  });

  activeEditor?.on('fieldAnnotationSelected', (params) => {
    console.log('fieldAnnotationSelected', { params });
  });

  activeEditor?.on('fieldAnnotationDeleted', (params) => {
    console.log('fieldAnnotationDeleted', { params });
  });
};
/* Inputs pane and field annotations */

const initToolbar = () => {
  return new SuperToolbar({ element: 'toolbar', editor: activeEditor, isDev: true, });
};

onMounted(async () => {
  // set document to blank
  currentFile.value = await getFileObject(BlankDOCX, 'blank_document.docx', DOCX);
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
            <BasicUpload @file-change="handleNewFile" accept=".docx" />
          </div>
        </div>
        <div class="dev-app__header-side dev-app__header-side--right">
          <button class="dev-app__header-export-btn" @click="exportDocx">Export</button>
        </div>
      </div>

      <div id="toolbar" class="sd-toolbar"></div>

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
                <SuperEditor
                  :file-source="currentFile" 
                  :options="editorOptions"
                />
              </div>
            </div>
        </div>

        <div>
          <!-- -->
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.dev-app {
  --header-height: 154px;
  --toolbar-height: 39px;

  width: 100%;
  height: 100vh;
}

.dev-app__layout {
  display: grid;
  width: 100%;
  height: 100vh;
}

.dev-app__header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
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
  grid-template-columns: 300px minmax(0, 1fr) 300px;
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
  display: flex;
  justify-content: center;
}

.dev-app__inputs-panel {
  display: grid;
  height: calc(100vh - var(--header-height) - var(--toolbar-height));
  background: #fff;
  border-right: 1px solid #dbdbdb;
}

.dev-app__inputs-panel-content {
  display: grid;
  overflow-y: auto;
  scrollbar-width: none;
}
.super-editor {
  border: 1px solid #dbdbdb;
}
</style>
