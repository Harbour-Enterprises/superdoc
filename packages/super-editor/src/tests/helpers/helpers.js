import { join, relative } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import { parseXmlToJson } from '@converter/v2/docxHelper.js';

export const getTestDataByFolderName = (name) => {
  const basePath = join(__dirname, '../data', name, 'docx');

  const readFilesRecursively = (currentPath) => {
    const fileDataMap = {};

    try {
      const entries = readdirSync(currentPath);

      entries.forEach(entry => {
        const entryPath = join(currentPath, entry);
        const stats = statSync(entryPath);

        // If the entry is a directory, recursively read its contents
        if (stats.isDirectory()) {
          const nestedFiles = readFilesRecursively(entryPath);
          Object.assign(fileDataMap, nestedFiles);
        }

        // If it's a file, read its contents and save it to the map
        else {
          const fileData = readFileSync(entryPath, 'utf8');
          const relativePath = relative(basePath, entryPath);

          // Parse XML files into basic JSON
          if (entry.endsWith('.xml')) fileDataMap[relativePath] = parseXmlToJson(fileData);
          else fileDataMap[relativePath] = fileData;
        }
      });
    } catch (err) {
      console.error(`Error reading path: ${currentPath}`, err);
    }

    return fileDataMap;
  };

  return readFilesRecursively(basePath);
};
