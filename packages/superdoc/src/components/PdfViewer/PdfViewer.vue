<script setup>
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?raw';
import { onMounted, ref, reactive } from 'vue';
import useSelection from '@/helpers/use-selection';

pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
  new Blob([pdfjsWorker], {
    type: 'application/javascript'
  }
));

const emit = defineEmits([
  'page-loaded',
  'ready',
  'selection-change',
  'selection-drag',
  'selection-drag-end',
]);
const totalPages = ref(null);
const viewer = ref(null);
const props = defineProps({
  documentData: {
    type: Object,
    required: true,
  },
});

const id = props.documentData.id;
const pdfData = props.documentData.data;
const selectionBounds = reactive({})

const getOriginalPageSize = (page) => {
  const viewport = page.getViewport({ scale: 1 });
  const width = viewport.width;
  const height = viewport.height;
  return { width, height };
};

async function loadPDF(blobUrl) {
  const loadingTask = pdfjsLib.getDocument(blobUrl);
  return await loadingTask.promise;
}

const enableTextLayer = (container, state) => {
  const textLayer = container.querySelector('.textLayer');
  if (textLayer) textLayer.style.pointerEvents = state ? 'auto' : 'none';
}

async function renderPages(pdfDocument) {
  try {
    const numPages = pdfDocument.numPages;
    totalPages.value = numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const container = document.createElement('div');
      container.className = 'pdf-page';
      container.dataset.pageNumber = i;
      container.id = `${id}-page-${i}`
      viewer.value.appendChild(container);
      
      const { width, height } = getOriginalPageSize(page);
      const scale = 1;
      const eventBus = new pdfjsViewer.EventBus();
      const pdfPageView = new pdfjsViewer.PDFPageView({
        container,
        id: i,
        scale,
        defaultViewport: page.getViewport({ scale }),
        eventBus,
      });

      const viewport = page.getViewport({ scale });
      const containerBounds = container.getBoundingClientRect();
      containerBounds.originalWidth = width;
      containerBounds.originalHeight = height;
      pdfPageView.setPdfPage(page);
      await pdfPageView.draw();

      // Emit page information
      emit('page-loaded', id, i, containerBounds);

      // Highlight event listeners
      // container.addEventListener('touchstart', (e) => onTouchStart(e, container), { passive: false });
      container.addEventListener('mousedown', (e) => onDragStart(e, container), { passive: false });
    }

    emit('ready', id, viewer)
  } catch (error) {
      console.error('Error loading PDF:', error);
  }
};

function getSelectedTextBoundingBox(container) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const boundingRects = range.getClientRects();
  
  if (boundingRects.length === 0) {
    return null;
  }

  // Initialize bounding box with the first bounding rectangle
  const firstRect = boundingRects[0];
  let boundingBox = {
    top: firstRect.top,
    left: firstRect.left,
    bottom: firstRect.bottom,
    right: firstRect.right
  };

  for (let i = 1; i < boundingRects.length; i++) {
    const rect = boundingRects[i];
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }
    boundingBox.top = Math.min(boundingBox.top, rect.top);
    boundingBox.left = Math.min(boundingBox.left, rect.left);
    boundingBox.bottom = Math.max(boundingBox.bottom, rect.bottom);
    boundingBox.right = Math.max(boundingBox.right, rect.right);
  }

  // Get the bounding box of the container
  const containerRect = container.getBoundingClientRect();

  // Adjust the bounding box relative to the page
  boundingBox.top = boundingBox.top - containerRect.top + container.scrollTop;
  boundingBox.left = boundingBox.left - containerRect.left + container.scrollLeft;
  boundingBox.bottom = boundingBox.bottom - containerRect.top + container.scrollTop;
  boundingBox.right = boundingBox.right - containerRect.left + container.scrollLeft;

  return boundingBox;
}

let isDragging = false;

const onDragStart = (e, container) => {
  const { target } = e;
  if (target.tagName !== 'SPAN') {
    isDragging = true;
    selectionBounds.left = e.offsetX;
    selectionBounds.top = e.offsetY;
    enableTextLayer(container, false);
  }

  const onDragMoveWrapper = (e) => onDragMove(e, container);
  const onDragEndWrapper = (e) => {
    document.removeEventListener('mouseup', onDragEndWrapper);
    document.removeEventListener('mousemove', onDragMoveWrapper);
    onDragEnd(e, container);
  }

  document.addEventListener('mouseup', onDragEndWrapper);
  document.addEventListener('mousemove', onDragMoveWrapper);
};

const onDragEnd = (e, container) => {
  let boundingBox = getSelectedTextBoundingBox(container) || {};
  if (isDragging) boundingBox = selectionBounds;

  const selection = useSelection({
    selectionBounds: boundingBox,
    page: container.dataset.pageNumber,
    documentId: id,
  });

  const containerBounds = container.getBoundingClientRect();
  if (isDragging) emit('selection-drag-end', selection, containerBounds);
  emit('selection-change', selection, container);

  isDragging = false;
  enableTextLayer(container, true);
}

const onDragMove = (e, container) => {
  if (!isDragging) return;
  selectionBounds.right = e.offsetX;
  selectionBounds.bottom = e.offsetY;
  const selection = useSelection({
    selectionBounds: selectionBounds,
    page: container.dataset.pageNumber,
    documentId: id,
  });
  emit('selection-drag', selection, e)
}

const onTouchStart = (e, container) => {
  isDragging = true;

  document.addEventListener('touchend', (e) => onTouchEnd(e, container));
  document.addEventListener('touchmove', (e) => onTouchMove(e, container));

  const touch = e.touches[0];
  const containerBounds = container.getBoundingClientRect();
  selectionBounds.left = touch.clientX;
  selectionBounds.top = touch.clientY - containerBounds.top;
};

const onTouchMove = (e, container) => {
  if (!isDragging || !container) return;

  const touch = e.touches[0];
  const containerBounds = container.getBoundingClientRect();
  selectionBounds.right = touch.clientX - containerBounds.left;
  selectionBounds.bottom = touch.clientY - containerBounds.top;
  const selection = useSelection({
    selectionBounds: selectionBounds,
    page: container.dataset.pageNumber,
    documentId: id,
  });

  emit('selection-drag', selection, e)
};

const onTouchEnd = (e, container) => {
  isDragging = false;
  document.removeEventListener('touchend', onTouchEnd);
  document.removeEventListener('touchmove', onTouchMove);

  const selection = useSelection({
    selectionBounds: selectionBounds,
    page: container.dataset.pageNumber,
    documentId: id,
  });
  const containerBounds = container.getBoundingClientRect();
  emit('selection-drag-end', selection, containerBounds);
  emit('selection-change', selection, container);
};

onMounted(async () => {
  const doc = await loadPDF(pdfData);

  setTimeout(async () => {
    await renderPages(doc);
  }, 150);
});
</script>

<template>
  <div>
    <div
        class="superdoc-viewer"
        ref="viewer"
        id="viewerId"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove">
    </div>
  </div>
</template>

<style lang="postcss">
.superdoc-viewer {
  @nested-import 'pdfjs-dist/web/pdf_viewer.css';
  
  position: relative;
  display: flex;
  flex-direction: column;

  .pdf-page {
    border: 1px solid #DFDFDF;
    margin: 0 0 20px 0;
    position: relative;
  }

  .textLayer {
    z-index: 2;
    position: absolute;
  }

  .textLayer ::selection {
    background-color: #1355ff66;
    mix-blend-mode: difference;
  }
}
</style>
