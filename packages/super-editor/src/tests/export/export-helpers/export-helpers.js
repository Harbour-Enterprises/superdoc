import { join } from 'path';
import { readFile } from 'fs/promises';
import { Editor } from '@core/Editor.js';
import { getStarterExtensions } from '@extensions/index.js';
import { exportSchemaToJson } from '@converter/exporter';

/**
 * Get the (first) text from a node
 * @param {Object} node The node to get the text from
 * @returns {string} The text from the node
 */
export const getTextFromNode = (node) => {
  const listTextNode = node.elements.find((el) => el.name === 'w:r');
  return listTextNode?.elements[0].elements[0].text;
};

/**
 * Load a test file into a buffer
 * @param {string} name The name of the file in the test data folder
 * @returns {Promise<ArrayBuffer>} The test data as abuffer
 */
const getTestDataAsBuffer = async (name) => {
  try {
    const basePath = join(__dirname, '../../data', name);
    return await readFile(basePath);
  } catch (error) {
      console.error('Error reading the file:', error);
      throw error;
  }
};

/**
 * Simplify getting exported data from the editor for export testing
 * Pass in a docx file in the test data folder, and returns the exported result
 * @param {string} name The name of the file in the test data folder
 * @returns {Promise<Object>} The exported result
 */
export const getExportedResult = async (name) => {
  const buffer = await getTestDataAsBuffer(name);
  const [docx, media, mediaFiles, fonts] = await Editor.loadXmlData(buffer, true)

  const editor = new Editor({
    isHeadless: true,
    extensions: getStarterExtensions(),
    documentId: 'test-doc',
    content: docx,
    media,
    mediaFiles,
    fonts,
  });

  const schema = editor.converter.getSchema();
  const bodyNode = editor.converter.savedTagsToRestore.find((el) => el.name === 'w:body');
  const [result, params] = exportSchemaToJson({
    node: schema,
    bodyNode,
    relationships: [],
    documentMedia: {},
    media: {},
    isFinalDoc: false,
    pageStyles: editor.converter.pageStyles,
  });

  return result;
};
