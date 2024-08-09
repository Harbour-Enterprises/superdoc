import JSZip, { file } from 'jszip';

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
    }
    return this.files;
  }

  async unzip(file) {
    const zip = await this.zip.loadAsync(file);
    return zip;
  }

  async updateZip(originalDocx, updatedDocs) {
    const updatedZip = new JSZip();
    const unzippedOriginalDocx = await this.unzip(originalDocx);

    // Create an array of promises to read all files
    const filePromises = [];

    // Iterate through all files from the original docx, and copy them to a new docx
    unzippedOriginalDocx.forEach((relativePath, zipEntry) => {
      const promise = zipEntry.async("string").then((content) => {
        updatedZip.file(zipEntry.name, content);
      });
      filePromises.push(promise);
    });
    // Wait for all promises to resolve
    await Promise.all(filePromises);
  
    Object.keys(updatedDocs).forEach((key) => {
      unzippedOriginalDocx.file(key, updatedDocs[key]);
    });
  
    // Replace the document file in the new zip
    // unzippedOriginalDocx.file("word/document.xml", newDocumentXmlContent);
    // unzippedOriginalDocx.file("word/_rels/document.xml.rels", rels);

    // Zip it up again and return
    return await unzippedOriginalDocx.generateAsync({ type: "blob" })
  }
}

export default DocxZipper;