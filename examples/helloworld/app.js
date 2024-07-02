import Superdoc from 'https://unpkg.com/@harbour-enterprises/superdoc@1.0.0-alpha.26/dist/superdoc.es.js'

const updateFileName = (name) => {
  const nameParts = name.split('.');
  if (nameParts.length > 1) nameParts.pop();
  document.getElementById('header-item-title-text').innerText = nameParts;
};

function handleFileUpload() {
    const uploader = document.getElementById('fileUpload')
    uploader.click();
}

function handleFileSelected(event) {
  const file = event.target.files[0];

  // Get the file name
  updateFileName(file.name);

  // Superdoc accepts links, so we'll turn this example file into an object URL
  const fileUrl = URL.createObjectURL(file);
  loadSuperDoc(fileUrl);
}

const loadSuperDoc = (fileURL) => {
  new Superdoc({
    selector: '#superdoc',
    documents: [
      {
        id: 'test-doc',
        type: 'docx',
        data: fileURL,
      }
    ],
  })
}

window.onload = () => {
  loadSuperDoc('./data/blank.docx');
}

window.handleFileUpload = handleFileUpload;
window.handleFileSelected = handleFileSelected;

export {
  handleFileUpload,
  handleFileSelected,
}