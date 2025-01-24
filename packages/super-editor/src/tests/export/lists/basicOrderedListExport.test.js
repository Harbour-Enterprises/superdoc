// prettier-ignore
import {
  getTextFromNode,
  getExportedResult,
  testListNodes,
} from '../export-helpers/index';

// describe('[simple-ordered-list.docx] simple ordered list tests', async () => {
//   // The file for this set of test
//   const fileName = 'simple-ordered-list.docx';
//   const result = await getExportedResult(fileName);
//   const body = {};

//   beforeEach(() => {
//     Object.assign(body, result.elements?.find((el) => el.name === 'w:body'));
//   });


//   it('can export the first list', () => {
//     const titleIndex = 0;
//     const firstTitle = body.elements[titleIndex];
//     const titleText = getTextFromNode(firstTitle);
//     expect(titleText).toBe('Simple ordered list:');

//     const item1 = body.elements[titleIndex + 2];

//     testListNodes({ node: item1, expectedLevel: 0, expectedNumPr: 0, text: 'Item 1' });
  
//     const item2 = body.elements[titleIndex + 3];
//     testListNodes({ node: item2, expectedLevel: 0, expectedNumPr: 0, text: 'Item 2' });
  
//     const item3 = body.elements[titleIndex + 4];
//     testListNodes({ node: item3, expectedLevel: 0, expectedNumPr: 0 });getTextFromNode
 
//     const nonListNode = body.elements[titleIndex + 5];
//     testListNodes({ node: nonListNode, expectedLevel: undefined, expectedNumPr: undefined, text: undefined });
//   });


//   it('can export the second list (with sublists)', () => {
//     const titleIndex = 6;
//     const titleNode = body.elements[titleIndex];
//     const titleText = getTextFromNode(titleNode);
//     expect(titleText).toBe('Simple ordered list with sub lists:');

//     const item1 = body.elements[titleIndex + 2];
//     testListNodes({ node: item1, expectedLevel: 0, expectedNumPr: 0, text: 'Item 1' });

//     const item3 = body.elements[titleIndex + 4];
//     testListNodes({ node: item3, expectedLevel: 0, expectedNumPr: 0, text: 'Item 3' });

//     const firstNestedItem = body.elements[titleIndex + 5];
//     testListNodes({ node: firstNestedItem, expectedLevel: 1, expectedNumPr: 1, text: 'Lvl 1 – a' });

//     const doubleNestedItem = body.elements[titleIndex + 7];
//     testListNodes({ node: doubleNestedItem, expectedLevel: 2, expectedNumPr: 2, text: 'Lvl 2 – i' });

//     const nestedItemAfterDoubleNested = body.elements[titleIndex + 8];
//     testListNodes({ node: nestedItemAfterDoubleNested, expectedLevel: 1, expectedNumPr: 1, text: 'Lvl 1 – c' });

//     const finalItem = body.elements[titleIndex + 9];
//     testListNodes({ node: finalItem, expectedLevel: 0, expectedNumPr: 0, text: 'Item 4' });
//   });
// });

describe('[basic-list-sublist-export-issue.docx] simple ordered list export mixed num IDs', async () => {
  // The issue with this document was that the third list item should be numId 3 but was
  // Exporting as numId 5
  const fileName = 'sublist-issue.docx';
  const result = await getExportedResult(fileName);
  const body = {};

  beforeEach(() => {
    Object.assign(body, result.elements?.find((el) => el.name === 'w:body'));
  });

  it('correctly exports the first list item', () => {
    const firstListItem = body.elements[2];
    const pPr = firstListItem.elements.find((el) => el.name === 'w:pPr' && el.elements?.length);
    const numPrTag = pPr.elements.find((el) => el.name === 'w:numPr');

    const numId = numPrTag.elements.find((el) => el.name === 'w:numId').attributes['w:val'];
    const ilvl = numPrTag.elements.find((el) => el.name === 'w:ilvl').attributes['w:val'];
    expect(numId).toBe("5");
    expect(ilvl).toBe(0);

    const paragraphProps = firstListItem.elements.find((el) => el.name === 'w:pPr');
    const spacing = paragraphProps.elements.find((el) => el.name === 'w:spacing').attributes;
    expect(spacing['w:line']).toBe('276');
    expect(spacing['w:lineRule']).toBe('auto');
  });

  it('correctly exports the third list item', () => {
    const thirdListItem = body.elements[6];
    const pPr = thirdListItem.elements.find((el) => el.name === 'w:pPr' && el.elements?.length);
    const numPrTag = pPr.elements.find((el) => el.name === 'w:numPr');

    const numId = numPrTag.elements.find((el) => el.name === 'w:numId').attributes['w:val'];
    const ilvl = numPrTag.elements.find((el) => el.name === 'w:ilvl').attributes['w:val'];
    expect(numId).toBe("3");
    expect(ilvl).toBe(1);
  });

  it('correctly exports the empty paragraph spacing', () => {
    const firstSpace = body.elements[5];
    expect(firstSpace.name).toBe('w:p');
    expect(firstSpace.elements.length).toBe(1);
    expect(firstSpace.elements[0].name).toBe('w:pPr');

    const secondSpace = body.elements[7];
    expect(secondSpace.name).toBe('w:p');
    expect(secondSpace.elements.length).toBe(1);
    expect(secondSpace.elements[0].name).toBe('w:pPr');

    const thirdSpace = body.elements[9];
    expect(thirdSpace.name).toBe('w:p');
    expect(thirdSpace.elements.length).toBe(1);
    expect(thirdSpace.elements[0].name).toBe('w:pPr');
  });
});