import { Editor, getStarterExtensions } from '@harbour-enterprises/superdoc/super-editor';
import { JSDOM } from 'jsdom';

/**
 * Main function to instantiate a SuperEditor instance from Editor.js
 * Since the editor is normally a front end class, we need to mock a couple of things - see comments below.
 * @param {*} originalDocxArrayBuffer 
 * @returns {Promise<Editor>} The Super Editor instance
 */
export const getEditor = async (originalDocxArrayBuffer = null) => {
  const { window: mockWindow } = (new JSDOM('<!DOCTYPE html><html><body></body></html>'));
  const { document: mockDocument } = mockWindow;

  let content = null, media = null;

  // if no originalDocxArrayBuffer is passed, we can't load any content
  if (!originalDocxArrayBuffer) return;
  if (originalDocxArrayBuffer) [content, media] = await Editor.loadXmlData(originalDocxArrayBuffer);

  // The standard list of extensions that the editor uses
  const extensions = getStarterExtensions();
  const options = {
    // We need to mock the element, since we are running in a headless environment
    element: { mount: mockDocument.createElement('div') },
    // Important, since we are running in a headless environment
    isHeadless: true,
    // We pass in the mock document and window here
    mockDocument,
    mockWindow,
    mode: 'docx',
    extensions,
    content,
    documentId: "test-doc-id",
  };

  return new Editor(options);
}