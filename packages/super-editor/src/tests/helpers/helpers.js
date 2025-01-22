import { join } from 'path';
import { readFile } from 'fs/promises';
import { parseXmlToJson } from '@converter/v2/docxHelper.js';
import DocxZipper from '@core/DocxZipper.js';

const EXTENSIONS_TO_CONVERT = new Set(['.xml', '.rels']);

/**
 * Load a test docx file into a map of file names to their content
 * @param {string} name The name of the file in the test data folder
 * @returns {Promise<Object>} The test data as a map of file names to their content
 */
export const getTestDataByFileName = async (name) => {
  const basePath = join(__dirname, '../data', name);
  const fileBuffer = await readFile(basePath);
  const zipper = new DocxZipper();
  const xmlFiles = await zipper.getDocxData(fileBuffer, true);
  return readFilesRecursively(xmlFiles);
};

export const getTestDataAsFileBuffer = async (name) => {
  const basePath = join(__dirname, '../data', name);
  const fileBuffer = await readFile(basePath);
  return fileBuffer;
};

const readFilesRecursively = (xmlFiles) => {
  const fileDataMap = {};

  try {
    xmlFiles.forEach((entry) => {
      const { name, content } = entry;
      const extension = name.slice(name.lastIndexOf('.'));
      if (EXTENSIONS_TO_CONVERT.has(extension)) fileDataMap[name] = parseXmlToJson(content);
      else fileDataMap[name] = fileData;
    });
  } catch (err) {
    console.error(`Error reading file:`, err);
  }

  return fileDataMap;
};
