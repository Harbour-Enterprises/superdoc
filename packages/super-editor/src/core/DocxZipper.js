import JSZip from 'jszip';
import { getContentTypesFromXml } from "./super-converter/helpers.js";

/**
 * Class to handle unzipping and zipping of docx files
 */
class DocxZipper {

  constructor(params = {}) {
    this.debug = params.debug || false;
    this.zip = new JSZip();
    this.files = [];
    this.media = {};
    this.mediaFiles = {};
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

        // Create an Object of media Uint8Arrays for collaboration
        // These will be shared via ydoc

        const extension = this.getFileExtension(zipEntry.name);
        const fileBase64 = await zipEntry.async('base64');
        this.mediaFiles[zipEntry.name] = `data:image/${extension};base64,${fileBase64}`;

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

  /**
   * Update [Content_Types].xml with extensions of new Image annotations
   */
  async updateContentTypes(unzippedOriginalDocx, media) {
    const newMediaTypes = Object.keys(media).map(name => {
      return this.getFileExtension(name);
    });

    const contentTypesPath = '[Content_Types].xml';
    const contentTypesXml = await unzippedOriginalDocx.file(contentTypesPath).async('string');
    let typesString = ''
    
    const defaultMediaTypes = getContentTypesFromXml(contentTypesXml);
    
    for (let type of newMediaTypes) {
      // Current extension already presented in Content_Types
      if (defaultMediaTypes.includes(type)) return;
      
      const newContentType = `<Default Extension="${type}" ContentType="image/${type}"/>`;
      typesString += newContentType;
    }
    
    const beginningString = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">';

    const updatedContentTypesXml = contentTypesXml.replace(
        beginningString,
        `${beginningString}${typesString}`
    );
    unzippedOriginalDocx.file(contentTypesPath, updatedContentTypesXml);
  }

  async unzip(file) {
    const zip = await this.zip.loadAsync(file);
    return zip;
  }

  async updateZip({ docx, updatedDocs, originalDocxFile, media }) {
    const isHeadless = navigator?.isHeadless;

    // We use a different re-zip process if we have the original docx vs the docx xml metadata
    let zip;
    if (originalDocxFile) {
      zip = await this.exportFromOriginalFile(originalDocxFile, updatedDocs, media);
    } else {
      zip = await this.exportFromCollaborativeDocx(docx, updatedDocs, media);
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
  async exportFromCollaborativeDocx(docx, updatedDocs, media) {
    const zip = new JSZip();
    for (const file of docx) {
      let content = file.content;
      if (file.name in updatedDocs) {
        content = updatedDocs[file.name];
      }
      zip.file(file.name, content);
    };

    Object.keys(media).forEach((name) => {
      zip.file(`word/media/${name}`, media[name]);
    });

    await this.updateContentTypes(zip, media);
    return zip;
  };

  /**
   * Export the Editor content to a docx file, updating changed docs
   * Requires the original docx file
   * @param {File} originalDocxFile The original docx file
   * @param {Object} updatedDocs An object containing the updated docs (keys are relative file names)
   * @returns {Promise<JSZip>} The unzipped but updated docx file ready for zipping
   */
  async exportFromOriginalFile(originalDocxFile, updatedDocs, media) {
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
      unzippedOriginalDocx.file(key, updatedDocs[key]);
    });

    Object.keys(media).forEach((name) => {
      unzippedOriginalDocx.file(`word/media/${name}`, media[name]);
    });

    await this.updateContentTypes(unzippedOriginalDocx, media);

    return unzippedOriginalDocx;
  };
}

export default DocxZipper;
