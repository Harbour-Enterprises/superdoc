import { runInputTests, testInputConversion, testLists } from './tests/super-converter/input-tests';
import { runOutputTests, testOutputConversion } from './tests/super-converter/output-tests';
import { runInputOutputTests } from './tests/super-converter/input-output';

// Available test files
const testFiles = [
  'sample',
  'fake-contract',
  'comments'
];


runInputOutputTests(); 


// Run tests for each of our test files
// testFiles.forEach((fileName) => {

//   // Run input tests (ie: from docx XML to SCHEMA)
//   // runInputTests(fileName);

//   // Input algorithm: Granular testing of known inputs
//   // testInputConversion();

//   // Run output tests (ie: from SCHEMA to docx XML)
//   // TODO
//   // runOutputTests(fileName);

//   // Output algorithm: Granular testing of known outputs
//   // testOutputConversion();
  
// });