// prettier-ignore
import { beforeAll, beforeEach, expect } from 'vitest';
import { expect } from 'vitest';
import { loadTestDataForEditorTests, initTestEditor } from '@tests/helpers/helpers.js';

describe('[blank-doc.docx] import, add node, export', async () => {
  const filename = 'blank-doc.docx';
  let docx, media, mediaFiles, fonts, editor;
  beforeAll(async () => ({ docx, media, mediaFiles, fonts } = await loadTestDataForEditorTests(filename)));
  beforeEach(() => (editor = initTestEditor({ content: docx, media, mediaFiles, fonts })));

  it('can create a list with two items, export correctly', () => {
  
    // Start with an empty document with only a paragraph
    let currentState = editor.getJSON();
    expect(currentState.content.length).toBe(1);
    expect(currentState.content[0].type).toBe('paragraph');
  
    // Start an ordered list
    editor.commands.toggleOrderedList();
    currentState = editor.getJSON();
    expect(currentState.content.length).toBe(1);
    expect(currentState.content[0].type).toBe('orderedList');
    expect(currentState.content[0].content.length).toBe(1);
    expect(currentState.content[0].content[0].type).toBe('listItem');
    expect(currentState.content[0].content[0].content.length).toBe(1);
    expect(currentState.content[0].content[0].content[0].type).toBe('paragraph');
    expect(currentState.content[0].content[0].content[0].content).toBeUndefined();

    // Insert hello world text into item 1
    // This will create a second list item, too
    const { view } = editor;
    const { state, dispatch } = view;
    let tr = getNewTransaction(editor);
    const listPosition = 1;

    let transaction = tr.insertText("hello world", listPosition);
    dispatch(transaction);

    currentState = editor.getJSON();
    expect(currentState.content.length).toBe(1);
    expect(currentState.content[0].type).toBe('orderedList');
    expect(currentState.content[0].content.length).toBe(2);
    expect(currentState.content[0].content[0].type).toBe('listItem');
    expect(currentState.content[0].content[0].content.length).toBe(1);
    expect(currentState.content[0].content[0].content[0].type).toBe('paragraph');
    expect(currentState.content[0].content[0].content[0].content[0].text).toBe('hello world');
  
    // Check the second list item - it should have no content
    expect(currentState.content[0].content[1].type).toBe('listItem');
    expect(currentState.content[0].content[1].content.length).toBe(1);
    expect(currentState.content[0].content[1].content[0].type).toBe('paragraph');
    expect(currentState.content[0].content[1].content[0].content).toBeUndefined();

    // Add text to second item
    tr = getNewTransaction(editor);
    const secondListPos = 3;
    transaction = tr.insertText("item 2", secondListPos);
    dispatch(transaction);
  
  });
});

const getNewTransaction = (editor) => {
  const { view } = editor;
  const { state, dispatch } = view;
  return state.tr;
}