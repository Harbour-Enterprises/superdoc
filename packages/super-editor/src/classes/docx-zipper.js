import JSZip from 'jszip';

/**
 * Class to handle unzipping and zipping of docx files
 */
class DocxZipper {

  constructor(params = {}) {
    this.debug = params.debug || false;
    this.zip = new JSZip();
    this.files = [];
  }

  /** 
   * Get XML data from the zipped docx 
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
  async getXmlData(file) {
    const extractedFiles = await this.unzip(file);
    const files = Object.entries(extractedFiles.files);

    for (const file of files) {
      const [_, zipEntry] = file;
      if (zipEntry.name.endsWith('.xml')) {
        const content = await zipEntry.async("string")
        this.files.push({
          name: zipEntry.name,
          content,
        });
      }
    }
    return this.files;
  }

  async unzip(file) {
    const zip = await this.zip.loadAsync(file);
    return zip;
  }

  async updateZip(originalZip, newDocumentXmlContent) {
    const updatedZip = new JSZip();

    // Create an array of promises to read all files
    const filePromises = [];

    originalZip.forEach((relativePath, zipEntry) => {
      const promise = zipEntry.async("uint8array").then((content) => {
        updatedZip.file(zipEntry.name, content);
      });
      filePromises.push(promise);
    });
  
    // Wait for all promises to resolve
    await Promise.all(filePromises);
  
    updatedZip.file("word/document.xml", newDocumentXmlContent);
    return updatedZip;
  }
}

export default DocxZipper;