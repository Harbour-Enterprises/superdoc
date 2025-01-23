// prettier-ignore
import { beforeAll, beforeEach, expect } from 'vitest';
import { loadTestDataForEditorTests, initTestEditor, getNewTransaction } from '@tests/helpers/helpers.js';
import { exportSchemaToJson } from '@converter/exporter';

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

    // Add text to the first list item
    const firstListPosition = 1;
    let transaction = tr.insertText("hello world", firstListPosition);

    // Add text to the second list item
    const secondListPosition = 17;
    transaction = tr.insertText("item 2", secondListPosition);
    dispatch(transaction);

    const currentState = editor.getJSON();
    const secondListItemTextNode = currentState.content[0].content[1].content[0].content[0].text;
    expect(secondListItemTextNode).toBe('item 2');

  });

  it('should have a third list item after insertText', () => {
    // Since we used insertText, we should have a third list item
    const currentState = editor.getJSON();
    console.debug('currentState:', JSON.stringify(currentState, null, 2));

  });

});
