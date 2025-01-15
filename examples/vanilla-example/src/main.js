import { Superdoc } from '@harbour-enterprises/superdoc';
import '@harbour-enterprises/superdoc/style.css';

// Initialize SuperDoc
let editor = null;

function initializeEditor(file = null) {
  // Cleanup previous instance if it exists
  if (editor) {
    editor = null;
  }

  editor = new Superdoc({
    selector: '#superdoc',
    toolbar: 'superdoc-toolbar',
    documentMode: 'editing',
    documents: [{
      id: `doc-${Date.now()}`,
      type: 'docx',
      data: file
    }],
    onReady: () => {
      console.log('Editor is ready');
    }
  });
}

// Setup file input handling
const fileInput = document.getElementById('fileInput');
const loadButton = document.getElementById('loadButton');

loadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) {
    initializeEditor(file);
  }
});

// Initialize empty editor on page load
initializeEditor();