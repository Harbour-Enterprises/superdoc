<script setup>
import 'tippy.js/dist/tippy.css';
import { NSkeleton } from 'naive-ui';
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@vue-3/index.js';
import { getStarterExtensions } from '@extensions/index.js';

const emit = defineEmits([
  'editor-ready',
  'comments-loaded',
  'selection-update'
]);

const props = defineProps({

  documentId: {
    type: String,
    required: false,
  },

  fileSource: {
    type: File,
    required: false,
  },

  state: {
    type: Object,
    required: false,
    default: () => null,
  },

  options: {
    type: Object,
    required: false,
    default: () => ({}),
  },

});

const editorReady = ref(false);
let editor;

const editorElem = ref(null);
let dataPollTimeout;

const stopPolling = () => {
  clearTimeout(dataPollTimeout);
};

const pollForMetaMapData = (ydoc, retries = 10, interval = 500) => {
  const metaMap = ydoc.getMap('meta');

  const checkData = () => {
    const docx = metaMap.get('docx');
    if (docx) {
      stopPolling();
      initEditor(docx);
    } else if (retries > 0) {
      console.debug(`Waiting for 'docx' data... retries left: ${retries}`);
      dataPollTimeout = setTimeout(checkData, interval); // Retry after the interval
      retries--;
    } else {
      console.warn('Failed to load docx data from meta map.');
    }
  };

  checkData();
};


const initializeData = async () => {
  let docx = null, media = null, mediaFiles = null;

  // If we have the file, initialize immediately from file
  if (props.fileSource) {
    [docx, media, mediaFiles] = await Editor.loadXmlData(props.fileSource);
    return initEditor(docx, media, mediaFiles);
  } 
  
  // If we are in collaboration mode, wait for the docx data to be available
  else if (props.options.ydoc && props.options.collaborationProvider) {
    delete props.options.content;
    const ydoc = props.options.ydoc;
    const provider = props.options.collaborationProvider;
    provider.on('synced', () => {
      pollForMetaMapData(ydoc);
    });
  } 
};

const initEditor = async (content, media = {}, mediaFiles = {}) => {
  editor = new Editor({
    mode: 'docx',
    element: editorElem.value,
    fileSource: props.fileSource,
    extensions: getStarterExtensions(),
    documentId: props.documentId,
    content,
    media,
    mediaFiles,
    users: [], // For comment @-mentions, only users that have access to the document
    ...props.options,
  });

  editor.on('create', () => {
    editorReady.value = true;
  });

  editor.on('collaborationUpdate', () => {
    editorReady.value = true;
  });
};

onMounted(() => {
  initializeData();

  if (props.options?.suppressSkeletonLoader || !props.options?.collaborationProvider) editorReady.value = true;
});

onBeforeUnmount(() => {
  stopPolling();
  editor?.destroy();
  editor = null;
});
</script>

<template>
  <div class="super-editor" v-show="editorReady">
    <div ref="editorElem" class="editor-element"></div>
  </div>

  <div class="placeholder-editor" v-if="!editorReady">
    <div class="placeholder-title">
      <n-skeleton text style="width: 60%" />
    </div>

    <n-skeleton text :repeat="6" />
    <n-skeleton text style="width: 60%" />

    <n-skeleton text :repeat="6" style="width: 30%; display: block; margin: 20px;"/>
    <n-skeleton text style="width: 60%" />
    <n-skeleton text :repeat="5" />
    <n-skeleton text style="width: 30%" />

    <n-skeleton text style="margin-top: 50px;" />
    <n-skeleton text :repeat="6" />
    <n-skeleton text style="width: 70%" />
  </div>
</template>

<style scoped>
.super-editor {
  box-sizing: border-box;
  display: inline-block;
  position: relative;
  min-width: 8.5in;
  min-height: 11in;
}
.placeholder-editor {
  box-sizing: border-box;
  width: 8.5in;
  height: 11in;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 1in;
}
.placeholder-title {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}
</style>
