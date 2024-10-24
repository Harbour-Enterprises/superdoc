import JSZip from 'jszip';

/**
 * Class to handle unzipping and zipping of docx files
 */
class DocxZipper {

  constructor(params = {}) {
    this.debug = params.debug || false;
    this.zip = new JSZip();
    this.files = [];
    this.media = {};
  }

  /** 
   * Get all docx data from the zipped docx 
   * 
   * [Content_Types].xml
   * _rels/.rels
   * word/document.xml
   * word/_rels/document.xml.rels
   * word/footnotes.xml
   * word/endnotes.xml
   * word/header1.xml
   * word/theme/theme1.xml
   * word/settings.xml
   * word/styles.xml
   * word/webSettings.xml
   * word/fontTable.xml
   * docProps/core.xml
   * docProps/app.xml
   * */
  async getDocxData(file) {
    const extractedFiles = await this.unzip(file);
    const files = Object.entries(extractedFiles.files);

    const mediaObjects = {};
    const validTypes = ['xml', 'rels'];
    for (const file of files) {
      const [_, zipEntry] = file;
      if (validTypes.some((validType) => zipEntry.name.endsWith(validType))) {
        const content = await zipEntry.async("string")
        this.files.push({
          name: zipEntry.name,
          content,
        });
      }

      else if (zipEntry.name.startsWith('word/media')) {
        const blob = await zipEntry.async('blob');
        const file = new File([blob], zipEntry.name, { type: blob.type });
        const imageUrl = URL.createObjectURL(file);
        this.media[zipEntry.name] = imageUrl;
      }
    }

    return this.files;
  }
  
  getFileExtension(fileName) {
    return fileName.split('.').pop();
  }

  async unzip(file) {
    const zip = await this.zip.loadAsync(file);
    return zip;
  }

  async updateZip({ docx, updatedDocs, originalDocxFile }) {
    const isHeadless = navigator?.isHeadless;

    // We use a different re-zip process if we have the original docx vs the docx xml metadata
    let zip;
    if (originalDocxFile) {
      zip = await this.exportFromOriginalFile(originalDocxFile, updatedDocs);
    } else {
      zip = await this.exportFromCollaborativeDocx(docx, updatedDocs);
    }

    // If we are headless we don't have 'blob' support, so export as 'nodebuffer'
    const exportType = isHeadless ? 'nodebuffer' : 'blob';
    return await zip.generateAsync({ type: exportType });
  }

  /**
   * Export the Editor content to a docx file, updating changed docs
   * @param {Object} docx An object containing the unzipped docx files (keys are relative file names)
   * @param {Object} updatedDocs An object containing the updated docs (keys are relative file names)
   * @returns {Promise<JSZip>} The unzipped but updated docx file ready for zipping
   */
  async exportFromCollaborativeDocx(docx, updatedDocs) {
    const zip = new JSZip();
    for (const file of docx) {
      let content = file.content;
      if (file.name in updatedDocs) {
        content = updatedDocs[file.name];
      }
      zip.file(file.name, content);
    };
    return zip;
  };

  /**
   * Export the Editor content to a docx file, updating changed docs
   * Requires the original docx file
   * @param {File} originalDocxFile The original docx file
   * @param {Object} updatedDocs An object containing the updated docs (keys are relative file names)
   * @returns {Promise<JSZip>} The unzipped but updated docx file ready for zipping
   */
  async exportFromOriginalFile(originalDocxFile, updatedDocs) {
    const unzippedOriginalDocx = await this.unzip(originalDocxFile);
    const filePromises = [];
    unzippedOriginalDocx.forEach((relativePath, zipEntry) => {
      const promise = zipEntry.async("string").then((content) => {
        unzippedOriginalDocx.file(zipEntry.name, content);
      });
      filePromises.push(promise);
    });
    await Promise.all(filePromises);

    // Make replacements of updated docs
    Object.keys(updatedDocs).forEach((key) => {
      if (key === 'word/document.xml') {
        unzippedOriginalDocx.file(key, updatedDocs[key]);
      };
    });

    return unzippedOriginalDocx;
  };
}

export default DocxZipper;