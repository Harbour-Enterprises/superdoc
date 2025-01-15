<template>
  <div class="document-editor">
    <div :key="documentKey">
      <div id="superdoc-toolbar" class="toolbar"></div>
      <div id="superdoc" class="editor"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Superdoc } from '@harbour-enterprises/superdoc';
import '@harbour-enterprises/superdoc/style.css';

const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  initialData: {
    type: File,
    default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['editor-ready', 'editor-error']);

// Use ref to track the editor instance
const editor = ref(null);
const documentKey = ref(0);

// Function to safely destroy editor
const destroyEditor = () => {
  if (editor.value) {
    editor.value = null;
  }
};

// Function to initialize editor
const initializeEditor = async () => {
  try {
    // Ensure cleanup of previous instance
    destroyEditor();
    
    // Increment key to force re-render
    documentKey.value++;

    // Create new editor instance
    editor.value = new Superdoc({
      selector: '#superdoc',
      toolbar: 'superdoc-toolbar',
      documentMode: props.readOnly ? 'viewing' : 'editing',
      documents: [{
        id: props.documentId,
        type: 'docx',
        data: props.initialData
      }],
      // Handle focus events
      onFocus: () => {
        console.log('Editor focused');
      },
      onBlur: () => {
        console.log('Editor lost focus');
      },
      onReady: () => {
        emit('editor-ready', editor.value);
      },
      onError: (error) => {
        emit('editor-error', error);
      }
    });
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    emit('editor-error', error);
  }
};

// Watch for changes in props that should trigger re-initialization
watch(
  () => [props.documentId, props.initialData, props.readOnly],
  () => {
    initializeEditor();
  }
);

onMounted(() => {
  initializeEditor();
});

onUnmounted(() => {
  destroyEditor();
});
</script>

<style scoped>
.document-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.toolbar {
  flex: 0 0 auto;
  border-bottom: 1px solid #eee;
  min-height: 40px; /* Ensure toolbar has minimum height */
}

.editor {
  flex: 1 1 auto;
  overflow: auto;
  min-height: 400px; /* Ensure editor has minimum height */
}
</style>