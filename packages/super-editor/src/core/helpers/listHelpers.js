import { generateRandomId } from './docxIdGenerator.js';

export function generateDocxListAttributes(listType) {

  // Our default blank doc definition has the following list types:
  const listTypesMap = {
    bulletList: 1,
    orderedList: 2,
  }

  console.debug('[generateDocxListAttributes] Generating list attributes for:', listType, listTypesMap[listType]);
  return {
    attributes: {
      "parentAttributes": {
        "w14:paraId": generateRandomId(),
        "w14:textId": generateRandomId(),
        "w:rsidR": generateRandomId(),
        "w:rsidRDefault": generateRandomId(),
        "w:rsidP": generateRandomId(),
        "paragraphProperties": {
          "type": "element",
          "name": "w:pPr",
          "elements": [
            {
              "type": "element",
              "name": "w:pStyle",
              "attributes": {
                "w:val": "ListParagraph"
              }
            },
            {
              "type": "element",
              "name": "w:numPr",
              "elements": [
                {
                  "type": "element",
                  "name": "w:ilvl",
                  "attributes": {
                    "w:val": "0"
                  }
                },
                {
                  "type": "element",
                  "name": "w:numId",
                  "attributes": {
                    "w:val": listTypesMap[listType] || 0,
                  }
                }
              ]
            }
          ]
        }
      }
    }
  }
};