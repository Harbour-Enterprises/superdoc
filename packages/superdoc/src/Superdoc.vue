<script setup>
import { getCurrentInstance, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia';
import PdfViewer from './components/PdfViewer/PdfViewer.vue';
import CommentsLayer from './components/CommentsLayer/CommentsLayer.vue';
import DocumentEditor from './components/DocumentEditor/DocumentEditor.vue';
import CommentDialog from '@/components/CommentsLayer/CommentDialog.vue';
import FloatingComments from '@/components/CommentsLayer/FloatingComments.vue';
import HrbrFieldsLayer from '@/components/HrbrFieldsLayer/HrbrFieldsLayer.vue';
import { useSuperdocStore } from '@/stores/superdoc-store';
import { useCommentsStore } from '@/stores/comments-store';

// Stores
const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();

const {
  documents,
  isReady,
  documentContainers,
  areDocumentsReady,
  selectionPosition,
  activeSelection
} = storeToRefs(superdocStore);
const { handlePageReady, modules, user, getDocument } = superdocStore;

const {
  getConfig,
  documentsWithConverations,
  pendingComment,
  floatingCommentsOffset
} = storeToRefs(commentsStore);
const { initialCheck, showAddComment } = commentsStore;
const { proxy } = getCurrentInstance();
commentsStore.proxy = proxy;

// Refs
const layers = ref(null);

// Comments layer
const commentsLayer = ref(null);
const toolsMenuPosition = ref(null);

// Hrbr Fields
const hrbrFieldsLayer = ref(null);

const handlePdfReady = (documentId, container) => {
  const doc = getDocument(documentId);
  doc.isReady = true;
  doc.container = container;
  if (areDocumentsReady.value) {
    isReady.value = true;
    nextTick(() => initialCheck());
  }
}

// Document selections
const handleSelectionChange = (selection) => {
  if (!selection.selectionBounds) return;
  
  activeSelection.value = selection

  // Place the tools menu at the level of the selection
  const containerBounds = selection.getContainerLocation(layers.value)

  let top = selection.selectionBounds.top + containerBounds.top;
  if (selection.selectionBounds.bottom - selection.selectionBounds.top < 0) {
    top = selection.selectionBounds.bottom + containerBounds.top;
  }

  toolsMenuPosition.value = {
    top: top - 25 + 'px',
    right: '-25px',
    zIndex: 10,
  };
}

const setSelectionPosition = (selection) => {
  activeSelection.value = selection;

  const containerBounds = selection.getContainerLocation(layers.value)
  
  let left = selection.selectionBounds.left;
  let top = selection.selectionBounds.top + containerBounds.top;

  // Flip top/bottom or left/right if reverse selection
  if (selection.selectionBounds.right - selection.selectionBounds.left < 0) left = selection.selectionBounds.right;
  if (selection.selectionBounds.bottom - selection.selectionBounds.top < 0) top = selection.selectionBounds.bottom;

  // Set the selection position
  selectionPosition.value = {
    zIndex: 500,
    position: 'absolute',
    border: '1px dashed #000',
    pointerEvents: 'none',
    top: top + 'px',
    left: left + 'px',
    width: Math.abs(selection.selectionBounds.right - selection.selectionBounds.left) + 'px',
    height: Math.abs(selection.selectionBounds.bottom - selection.selectionBounds.top) + 'px',
    borderRadius: '4px',
  };
}
  
const handleSelectionDrag = (selection, e) => {
  if (!selection.selectionBounds) return;
  setSelectionPosition(selection);
}

const handleSelectionDragEnd = () => {
  if (!selectionPosition.value) return;
  selectionPosition.value.border = '1px solid transparent';
}

const handleToolClick = (tool) => {
  const toolOptions = {
    comments: showAddComment,
  }

  if (tool in toolOptions) {
    setSelectionPosition(activeSelection.value);
    toolOptions[tool](activeSelection.value, selectionPosition.value);
  }

  activeSelection.value = null;
  toolsMenuPosition.value = null;
}

const handleDocumentMouseDown = (e) => {
  if (pendingComment.value) return;
  selectionPosition.value = null;;
}

const handleHighlightClick = () => {
  toolsMenuPosition.value = null;
}

const cancelPendingComment = () => {
  selectionPosition.value = null;
}

onMounted(() => {
  if ('comments' in modules && !modules.comments.readOnly) {
    document.addEventListener('mousedown', handleDocumentMouseDown);
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMouseDown);
});

</script>

<template>
<div class="superdoc">
  <div class="layers" ref="layers">

    <div
        v-if="toolsMenuPosition && !getConfig?.readOnly" 
        class="tools"
        :style="toolsMenuPosition">
      <i class="fas fa-comment-alt-lines" data-id="is-tool" @click.stop.prevent="handleToolClick('comments')"></i>
    </div>

    <div
        v-if="!getConfig?.readOnly && selectionPosition"
        :style="selectionPosition" class="sd-highlight sd-initial-highlight">
    </div>

    <div class="document">
      <!-- Fields layer -->
      <HrbrFieldsLayer
          v-if="'hrbr-fields' in modules && layers"
          :fields="modules['hrbr-fields']"
          class="comments-layer"
          style="z-index: 5; background-color: blue;"
          ref="hrbrFieldsLayer" />

      <!-- On-document comments layer -->
      <CommentsLayer
          class="comments-layer"
          v-if="isReady && 'comments' in modules && layers"
          style="z-index: 3;"
          ref="commentsLayer"
          :parent="layers"
          :user="user"
          @highlight-click="handleHighlightClick" />

      <div class="sub-document" v-for="doc in documents" ref="documentContainers">
        <!-- PDF renderer -->
        <PdfViewer
            v-if="doc.type === 'pdf'"
            :document-data="doc"
            @selection-change="handleSelectionChange"
            @selection-drag="handleSelectionDrag"
            @selection-drag-end="handleSelectionDragEnd"
            @ready="handlePdfReady" 
            @page-loaded="handlePageReady" />

        <!-- DOCX Renderer -->
        <DocumentEditor
            v-if="doc.type === 'docx'"
            :document-data="doc"
            @ready="handlePdfReady" />
      </div>
    </div>
  </div>

  <div class="right-sidebar" v-if="(pendingComment || documentsWithConverations.length) && layers && isReady">
    <CommentDialog
        v-if="pendingComment"
        :data="pendingComment"
        :current-document="getDocument(pendingComment.documentId)"
        :user="user" 
        :parent="layers"
        v-click-outside="cancelPendingComment" />

    <FloatingComments
        v-for="doc in documentsWithConverations"
        :parent="layers"
        :current-document="doc" />
  </div>
</div>
</template>

<style scoped>
/* Right sidebar drawer */
.right-sidebar {
  width: 320px;
  padding: 0 10px;
  min-height: 100%;
  position: relative;
}

/* General Styles */
.box-sizing, .layers {
  box-sizing: border-box;
}
.cursor-pointer, .tools i, .toolbar-item {
  cursor: pointer;
}
.flex {
  display: flex;
}
.flex-column {
  flex-direction: column;
}
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Layer Styles */
.comments-layer {
  position: absolute;
  top: 0;
  height: 100%;
}
.layers {
  position: relative;
}

/* Document Styles */
.docx {
  border: 1px solid #DFDFDF;
  pointer-events: auto;
}
.sub-document {
  position: relative;
}

/* Toolbar Styles */
.toolbar {
  height: 25px;
  background-color: #fff;
  margin-bottom: 5px;
}
.toolbar-item {
  width: 20px;
  height: 20px;
  border-radius: 8px;
  border: 1px solid #DBDBDB;
  padding: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 250ms ease;
}
.toolbar-item:hover {
  background-color: #DBDBDB;
}

/* Tools Styles */
.tools {
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: rgba(219, 219, 219, 0.6);
  border-radius: 12px;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tools i {
  font-size: 20px;
  border-radius: 12px;
  border: none;
  outline: none;
  background-color: #DBDBDB;
}

@media (max-width: 768px) {
  .sub-document {
    max-width: 100%;
    overflow: hidden;
  }
  .right-sidebar {
    padding: 10px;
    width: 55px;
    position: relative;
  }
}
</style>
