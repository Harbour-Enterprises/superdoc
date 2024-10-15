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
const editor = shallowRef();
const editorElem = ref(null);

const pollForMetaMapData = (ydoc, retries = 10, interval = 500) => {
  const metaMap = ydoc.getMap('meta');

  const checkData = () => {
    const docx = metaMap.get('docx');
    if (docx) {
      initEditor(docx);
    } else if (retries > 0) {
      console.debug(`Waiting for 'docx' data... retries left: ${retries}`);
      setTimeout(checkData, interval); // Retry after the interval
      retries--;
    } else {
      console.warn('Failed to load docx data from meta map.');
    }
  };

  checkData();
};


const initializeData = async () => {
  let docx = null, media = null;
  if (props.fileSource) {
    [docx, media] = await Editor.loadXmlData(props.fileSource);
    return initEditor(docx, media);
  } else {
    delete props.options.content;
    const ydoc = props.options.ydoc;
    const provider = props.options.collaborationProvider;
    provider.on('synced', () => {
      pollForMetaMapData(ydoc);
    });
  } 
};

const initEditor = async (content, media = {}) => {
  editor.value = new Editor({
    mode: 'docx',
    element: editorElem.value,
    fileSource: props.fileSource,
    initialState: props.state,
    extensions: getStarterExtensions(),
    documentId: props.documentId,
    content,
    media,
    users: [
      { name: 'Nick Bernal', email: 'nick@harbourshare.com' },
      { name: 'Artem Nistuley', email: 'nick@harbourshare.com' },
      { name: 'Matthew Connelly', email: 'matthew@harbourshare.com' },
      { name: 'Eric Doversberger', email: 'eric@harbourshare.com'} 
    ],
    ...props.options,
    onCreate,
  });
};

const onCreate = (data) => {
  console.debug('Editor created:', data);
  editorReady.value = true; 
  if (props.options.onCreate) {
    props.options.onCreate(data);
  }
}

onMounted(() => {
  initializeData();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
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
