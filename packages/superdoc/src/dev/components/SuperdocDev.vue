<script setup>
import '@harbour-enterprises/common/styles/common-styles.css';
import { nextTick, onMounted, ref, shallowRef } from 'vue';
import { Superdoc } from '@core/index.js';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { BasicUpload } from '@harbour-enterprises/common';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';
import EditorInputs from './EditorInputs.vue';
import { fieldAnnotationHelpers } from '@harbour-enterprises/super-editor';

/* For local dev */
let superdoc = shallowRef(null);
let activeEditor = shallowRef(null);

const currentFile = ref(null);
const getFileObject = async (fileUrl, name, type) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], name, { type });
}

const handleNewFile = async (file) => {
  // Generate a file url
  const url = URL.createObjectURL(file);
  currentFile.value = await getFileObject(url, file.name, file.type);

  nextTick(() => {
    initializeApp();
  });
}

const initializeApp = async () => {
  const config = {
    selector: '#superdoc',
    toolbar: 'toolbar',
    documentMode: 'editing',
    user: {
      name: 'Super Document Jr.',
      email: 'user@harbourshare.com',
    },
    documents: [
      {
        data: currentFile.value,
        id: '123',
      },
    ],
    modules: {
      'comments': {
        // readOnly: true,
        // allowResolve: false,
      },
      'hrbr-fields': {},
    },
  }
  superdoc.value = new Superdoc(config);
  
  superdoc.value.on('editorCreate', onEditorCreate);
};

const exportDocx = async () => {
  const result = await activeEditor.value?.exportDocx();
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

const onEditorCreate = ({ editor }) => {
  activeEditor.value = editor;

  editor.on('fieldAnnotationDropped', ({ 
    sourceField,
    editor,
    pos 
  }) => {
    console.log('fieldAnnotationDropped', { sourceField });

    let signer = signersListInfo.value.find((signer) => signer.signerindex === activeSigner.value);
    editor.commands.addFieldAnnotation(pos, {
      displayLabel: 'Text field',
      fieldId: `agreementinput-${Date.now()}-${Math.floor(Math.random() * 1000000000000)}`,
      // fieldId: `111`,
      fieldType: 'TEXTINPUT',
      fieldColor: signer?.signercolor,
    });
  });

  editor.on('fieldAnnotationClicked', (params) => {
    console.log('fieldAnnotationClicked', { params });
  });

  editor.on('fieldAnnotationSelected', (params) => {
    console.log('fieldAnnotationSelected', { params });
  });
};
/* Inputs pane and field annotations */

onMounted(async () => {
  handleNewFile(await getFileObject(BlankDOCX, 'blank_document.docx', DOCX));
});

const onTextFieldInput = (event) => {
  let value = event.target.value || 'Enter your info';
  let id = event.target.dataset.id;

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    displayLabel: value,
  });
};

const onImageFieldInput = (event) => {
  let value = event.target.value || null;
  let id = event.target.dataset.id;

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    imageSrc: value,
  });
};

const onHtmlFieldInput = (event) => {
  let value = event.target.value || null;
  let id = event.target.dataset.id;

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    rawHtml: value,
  });
};

const onDropdownFieldInput = (event) => {
  let value = event.target.value || 'Select option';
  let id = event.target.dataset.id;

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    displayLabel: value,
  });
};

const onYesNoFieldInput = (event) => {
  let value = event.target.value;
  let id = event.target.dataset.id;

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    displayLabel: value,
  });
};

const onCheckboxFieldInput = (event) => {
  let value = event.target.checked;
  let id = event.target.dataset.id;

  let label = value ? 'x' : '  ';

  activeEditor.value?.commands.updateFieldAnnotations(id, {
    displayLabel: label,
  });
};
</script>

<template>
  <div class="dev-app">
    <div class="dev-app__layout">

      <div class="dev-app__header">
        <div class="dev-app__header-side dev-app__header-side--left">
          <div class="dev-app__header-title">
            <h2>🦋 SuperDoc Dev</h2>
          </div>
          <div class="dev-app__header-upload">
            Upload docx, pdf or (soon) html
            <BasicUpload @file-change="handleNewFile" />
          </div>
        </div>
        <div class="dev-app__header-side dev-app__header-side--right">
          <button class="dev-app__header-export-btn" @click="exportDocx">Export Docx</button>
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
              <div id="superdoc"></div>
            </div>
          </div>
        </div>

        <div>
          <div>Text fields</div><br>
          <div>
            <label for="">Enter your info </label> 
            <input @input="onTextFieldInput" type="text" data-id="111">
          </div><br>
          <div>
            <label for="">Enter your info </label>
            <input @input="onTextFieldInput" type="text" data-id="222">
          </div>
          <br><br>
          
          <div>Image fields</div><br>
          <div>
            <label for="">Signature </label> 
            <input @input="onImageFieldInput" type="text" data-id="333">
          </div><br>
          <div>
            <label for="">Image </label>
            <input @input="onImageFieldInput" type="text" data-id="444">
          </div>
          <br><br>

          <div>Html field</div><br>
          <div>
            <label for="">Paragraph </label> 
            <input @input="onHtmlFieldInput" type="text" data-id="555">
          </div>
          <br><br>

          <div>Dropdown field</div><br>
          <div>
            <label for="">Options </label> 
            <select @input="onDropdownFieldInput" data-id="666">
              <option disabled selected value="">Select option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
          <br><br>

          <div>Yes/No field</div><br>
          <div> 
            <label for="">Yes</label>
            <input type="radio" id="yes" name="yesno" value="Yes" @input="onYesNoFieldInput" data-id="777" />
            <label for="">No</label>
            <input type="radio" id="no" name="yesno" value="No" @input="onYesNoFieldInput" data-id="777" />
          </div>
          <br><br>

          <div>Checkbox fields</div><br>
          <div> 
            <label for="">Checkbox 1</label>
            <input type="checkbox" @input="onCheckboxFieldInput" data-id="888" />
            <label for="">Checkbox 2</label>
            <input type="checkbox" @input="onCheckboxFieldInput" data-id="999" />
          </div>
          <br><br>


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

.super-editor {
  border: none !important;
}
.sd-toolbar {
  min-width: 800px;
  width: 100%;
}
.superdoc .layers {
  cursor: text;
  background-color: white;
  border-radius: 16px;
  border: 1px solid #d3d3d3 !important;
  text-align: left;
  box-shadow:0 0 5px hsla( 0,0%,0%,.05);
  transition: all 0.18s ease-out;
  margin: 50px;
}
.superdoc .layers:hover {
  border: 1px solid #0160cc86;
  box-shadow:0 0 5px hsla( 0,0%,0%,.1);
}
.superdoc .layers:focus-within {
  border: 1px solid #015fcc;
  box-shadow:0 0 5px hsla( 0,0%,0%,.3 );
}
tr {
  height: 5px !important;
  padding: 0 !important;
  margin: 0 !important;
}
p {
  margin: 0 !important;
  padding: 0 !important;
}
</style>

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
  /* width: 100%;
  max-width: 8.5in; */
  width: auto;
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
</style>
