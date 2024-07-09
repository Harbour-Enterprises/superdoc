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

let superdoc;
let activeEditor;
const loadSuperDoc = async (fileURL) => {

  const getFileObject = async (fileURL) => {
    // Generate a file url
    const response = await fetch(fileURL);
    const blob = await response.blob();
    return new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // Generate file object
  const data = await getFileObject(fileURL);

  // Destroy the previous Superdoc instance, if any
  if (superdoc) superdoc.destroy();

  // Load the new Superdoc instance from CDN library
  const Superdoc = window.SuperDoc;
  superdoc = new Superdoc({
    selector: '#superdoc',
    toolbar: 'superdoc-toolbar',
    documents: [
      {
        id: 'test-doc',
        type: 'docx',
        data,
      }
    ],
  });
}

const exportDocx = async () => {
  const result = await superdoc.activeEditor.exportDocx();
  const blob = new Blob([result], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.docx';
  a.click();
}

window.onload = () => {
  // Initialize with a blank docx
  loadSuperDoc('./data/blank.docx');
}
