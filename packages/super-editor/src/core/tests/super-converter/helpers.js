import path from 'path';
import fs from 'fs';

// Helpers to read files
const readFileSync = (pathName) => fs.readFileSync(path.resolve(__dirname, pathName), 'utf-8');
const getSchemaPath = (fileName) => `../../../tests/fixtures/${fileName}/${fileName}.schema.json`;

export {
  readFileSync,
  getSchemaPath,
}