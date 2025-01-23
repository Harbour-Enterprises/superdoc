// prettier-ignore
import { beforeAll, beforeEach, expect } from 'vitest';
import { TextSelection } from "prosemirror-state";
import { loadTestDataForEditorTests, initTestEditor, getNewTransaction } from '@tests/helpers/helpers.js';

describe('[blank-doc.docx] import, add node, export', () => {
  const filename = 'blank-doc.docx';
  let docx, media, mediaFiles, fonts, editor, dispatch;

  beforeAll(async () => {
    ({ docx, media, mediaFiles, fonts } = await loadTestDataForEditorTests(filename));
    ({ editor, dispatch } = initTestEditor({ content: docx, media, mediaFiles, fonts }));
  });

  // beforeEach(() => ({ editor, dispatch } = initTestEditor({ content: docx, media, mediaFiles, fonts })));

  it('starts with an empty document containing only a paragraph', () => {
    const currentState = editor.getJSON();
    expect(currentState.content.length).toBe(1);
    expect(currentState.content[0].type).toBe('paragraph');
  });

  it('can start an ordered list', () => {
    editor.commands.toggleOrderedList();
    const currentState = editor.getJSON();
    expect(currentState.content.length).toBe(1);
    expect(currentState.content[0].type).toBe('orderedList');
    expect(currentState.content[0].content.length).toBe(1);
    expect(currentState.content[0].content[0].type).toBe('listItem');
    expect(currentState.content[0].content[0].content.length).toBe(1);
    expect(currentState.content[0].content[0].content[0].type).toBe('paragraph');
    expect(currentState.content[0].content[0].content[0].content).toBeUndefined();
  });

  it('can add text to the first list item', () => {
    const tr = getNewTransaction(editor);
    const listPosition = 1;

    tr.insertText("hello world", listPosition);
    dispatch(tr);

    const currentState = editor.getJSON();
    expect(currentState.content[0].content[0].content[0].content[0].text).toBe('hello world');

    // Insert text will automatically generate the next list item here too
    expect(currentState.content[0].content.length).toBe(2); // Expect two list items
    expect(editor.state.doc.content.size).toBe(21);
  });

  it('correctly exports after the first list item', () => {
    const { result: exported } = editor.converter.exportToXmlJson({
      data: editor.getJSON(),
      editor
    });

    expect(exported).toBeDefined();
    expect(exported.elements.length).toBe(1);
    expect(exported.elements[0].name).toBe('w:body');

    const listItem = exported.elements[0].elements[0];
    const pPr = listItem.elements[0];
    const numPr = pPr.elements[0];
    expect(numPr.elements.length).toBe(2);

    const numIdTag = numPr.elements.find((el) => el.name === 'w:numId');
    const numId = numIdTag.attributes['w:val'];
    expect(numId).toBe(2);

    const lvl = numPr.elements.find((el) => el.name === 'w:ilvl');
    const lvlText = lvl.attributes['w:val'];
    expect(lvlText).toBe(0);

    const runText = listItem.elements[1].elements[0].elements[0].text;
    expect(runText).toBe('hello world');

  });

  it('can add text to the second list item', () => {
    let tr = getNewTransaction(editor);

    // Add text to the second list item
    const secondListPosition = 16;
    tr.insertText("item 2", secondListPosition);
    dispatch(tr);

    const currentState = editor.getJSON();
    const secondListItemTextNode = currentState.content[0].content[1].content[0].content[0].text;
    expect(secondListItemTextNode).toBe('item 2');

  });

  it('should have a third list item after insertText', () => {
    // Since we used insertText, we should have a third list item
    const currentState = editor.getJSON();
    expect(currentState.content[0].content.length).toBe(3);

    const thirdNode = currentState.content[0].content[2];
    expect(thirdNode.type).toBe('listItem');
    expect(thirdNode.content[0].content).toBeUndefined();
  });

  it('can break up the list between first and second item', () => {
    // Set the selection at the first list element
    let tr = getNewTransaction(editor);
    tr.setSelection(TextSelection.create(editor.state.doc, 14));
    dispatch(tr);

    // Break up the list (should generate a new second list item between hello world and item 2)
    const splitResult = editor.commands.splitListItem('listItem');
    expect(splitResult).toBe(true);
  });

  it('breaks up the list between item 1 and 2', () => {
    editor.commands.liftEmptyBlockAndContinueListOrder();

    // Insert text between the two list items
    let tr = getNewTransaction(editor);
    const breakPos = 18;
    tr.insertText("--- break", breakPos);
    dispatch(tr);

    const currentState = editor.getJSON();
    const content = currentState.content;
    const firstListItem = content[0];
    const firstText = firstListItem.content[0].content[0].content[0].text;
    expect(firstText).toBe('hello world');

    const newParagraph = content[1];
    const newText = newParagraph.content[0].text;
    expect(newText).toBe('--- break');

    const secondListItem = content[2];
    const secondText = secondListItem.content[0].content[0].content[0].text;
    expect(secondText).toBe('item 2');

  });

  it('exports list correctly with break', () => {
    // editor.state.doc.descendants((node, pos) => {
    //   console.log(node.type.name, pos);
    // });
    //console.debug(JSON.stringify(newParagraph, null, 2));
  });
});
