<script setup>
import '@harbour-enterprises/common/styles/common-styles.css';
import { nextTick, onMounted, provide, ref, shallowRef } from 'vue';

import { SuperDoc } from '@core/index.js';
import { DOCX, PDF, HTML } from '@harbour-enterprises/common';
import { BasicUpload, getFileObject } from '@harbour-enterprises/common';
import { fieldAnnotationHelpers } from '@harbour-enterprises/super-editor';
import BlankDOCX from '@harbour-enterprises/common/data/blank.docx?url';
import { toolbarIcons } from '../../../../super-editor/src/components/toolbar/toolbarIcons';

/* For local dev */
const superdoc = shallowRef(null);
const activeEditor = shallowRef(null);

const title = ref('initial title');
const currentFile = ref(null);

const user = {
  name: `SuperDoc ${Math.floor(1000 + Math.random() * 9000)}`,
  email: 'user@harbourshare.com',
};

const handleNewFile = async (file) => {
  // Generate a file url
  const url = URL.createObjectURL(file);
  currentFile.value = await getFileObject(url, file.name, file.type);

  nextTick(() => {
    init();
  });
};

const sampleComments = [
  {
    "uid": "123",
    "commentId": "2ed4f843-2618-4c69-ab20-ab35e593fc88",
    "fileId": "document-123",
    "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "creatorEmail": "test@harbourshare.com",
    "creatorName": "SuperDoc 6379",
    "isInternal": true,
    "commentText": "<p>first comment</p>",
    "selection": {
        "documentId": "document-123",
        "page": 1,
        "selectionBounds": {
            "top": 1,
            "left": 2,
            "right": 721,
            "bottom": 115.390625
        }
    },
    "resolvedTime": 123456,
    "resolvedByEmail": null,
    "resolvedByName": null
  },
  {
    "uid": "abc",
    "commentId": "2ed4f843-2618-4c69-ab20-abc",
    "parentCommentId": "2ed4f843-2618-4c69-ab20-ab35e593fc88",
    "fileId": "document-123",
    "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "creatorEmail": "test@harbourshare.com",
    "creatorName": "SuperDoc 6379",
    "isInternal": true,
    "commentText": "<p>I am a subcomment</p>",
    "selection": {
        "documentId": "document-123",
        "page": 1,
        "selectionBounds": {
            "top": 1,
            "left": 2,
            "right": 721,
            "bottom": 115.390625
        }
    },
    "resolvedTime": null,
    "resolvedByEmail": null,
    "resolvedByName": null
  },
  {
    "uid": "1basd",
    "commentId": "2ed4f843-2618-4c69-ab20-xx",
    "fileId": "document-123",
    "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "creatorEmail": "test@harbourshare.com",
    "creatorName": "SuperDoc 6379",
    "isInternal": true,
    "commentText": "<p>second comment</p>",
    "selection": {
        "documentId": "document-123",
        "page": 1,
        "selectionBounds": {
            "top": 1,
            "left": 2,
            "right": 721,
            "bottom": 115.390625
        }
    },
    "resolvedTime": null,
    "resolvedByEmail": null,
    "resolvedByName": null
  },
];

const init = async () => {

  let testId = 'document-123';
  // const testId = "document_6a9fb1e0725d46989bdbb3f9879e9e1b";
  const config = {
    superdocId: 'superdoc-dev',
    selector: '#superdoc',
    toolbar: 'toolbar',
    // toolbarGroups: ['center'],
    role: 'editor',
    documentMode: 'editing',
    toolbarGroups: ['left', 'center', 'right'],
    pagination: true,
    // isDev: true,
    user,
    documents: [
      {
        data: currentFile.value,
        id: testId,
        isNewFile: true,
      },
    ],
    modules: {
      comments: {
        comments: sampleComments,
        selector: 'comments-panel',
      },
      'hrbr-fields': {},

      // To test this dev env with collaboration you must run a local collaboration server here.
      // collaboration: {
      //   url: 'ws://localhost:3050/docs/superdoc-id',
      //   token: 'token',
      // }
    },
    onEditorCreate,
    onContentError,
    // handleImageUpload: async (file) => url,
    // Override icons.
    toolbarIcons: {},
    onCommentsUpdate,
  };

  superdoc.value = new SuperDoc(config);

  // const ydoc = superdoc.value.ydoc;
  // const metaMap = ydoc.getMap('meta');
  // metaMap.observe((event) => {
  //   const { keysChanged } = event;
  //   keysChanged.forEach((key) => {
  //     if (key === 'title') {
  //       title.value = metaMap.get('title');
  //     }
  //   });
  // });
};

const onCommentsUpdate = (updateData) => {
  console.debug('[END USER] Comments updated', updateData);
};

const onContentError = ({ editor, error, documentId, file }) => {
  console.debug('Content error on', documentId, error);
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

const onEditorCreate = ({ editor }) => {
  activeEditor.value = editor;

  editor.on('fieldAnnotationClicked', (params) => {
    console.log('fieldAnnotationClicked', { params });
  });

  editor.on('fieldAnnotationSelected', (params) => {
    console.log('fieldAnnotationSelected', { params });
  });
};

const handleTitleChange = (e) => {
  title.value = e.target.innerText;

  const ydoc = superdoc.value.ydoc;
  const metaMap = ydoc.getMap('meta');
  metaMap.set('title', title.value);
  console.debug('Title changed', metaMap.toJSON());
};

onMounted(async () => {
  handleNewFile(await getFileObject(BlankDOCX, 'test.docx', DOCX));
});
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
        <div class="dev-app__view">
          <div class="comments-panel" id="comments-panel"></div>

          <div class="dev-app__content" v-if="currentFile">
            <div class="dev-app__content-container">
              <div id="superdoc"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.sd-toolbar {
  min-width: 800px;
  width: 100%;
}
.superdoc .layers {
  background-color: white;
  border-radius: 16px;
  border: 1px solid #d3d3d3 !important;
  text-align: left;
  box-shadow: 0 0 5px hsla(0, 0%, 0%, 0.05);
  transition: all 0.18s ease-out;
  margin: 50px;
}
.superdoc .layers:hover {
  border: 1px solid #0160cc86;
  box-shadow: 0 0 5px hsla(0, 0%, 0%, 0.1);
}
.superdoc .layers:focus-within {
  border: 1px solid #015fcc;
  box-shadow: 0 0 5px hsla(0, 0%, 0%, 0.3);
}
</style>

<style scoped>
.temp-comment {
  margin: 5px;
  border: 1px solid black;
  display: flex;
  flex-direction: column;
}
.comments-panel {
  position: absolute;
  right: 0;
  height: 100%;
  background-color: #FAFAFA;
  z-index: 100;
}
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
  display: flex;
  justify-content: center;
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
