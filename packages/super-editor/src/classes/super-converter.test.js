import { runInputTests, testInputConversion } from './super-converter-tests/input-tests';
import { runOutputTests, testOutputConversion } from './super-converter-tests/output-tests';

// Available test files
const testFiles = [
  'sample',
  'fake-contract',
  'comments'
];

// Run tests for each of our test files
testFiles.forEach((fileName) => {

  // Run input tests (ie: from docx XML to SCHEMA)
  runInputTests(fileName);

  // Input algorithm: Granular testing of known inputs
  testInputConversion();

  // Run output tests (ie: from SCHEMA to docx XML)
  // TODO
  runOutputTests(fileName);

  // Output algorithm: Granular testing of known outputs
  testOutputConversion();
  
});