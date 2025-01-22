import { getTestDataAsFileBuffer } from '@tests/helpers/helpers.js';
import { beforeAll, beforeEach, expect } from 'vitest';
import { Editor } from '@core/Editor.js';
import { getStarterExtensions } from '@extensions/index.js';

describe('[custom-list1.docx] test import custom lists', () => {

  const filename = 'custom-list1.docx';
  let editor;
  let docx, media, mediaFiles, fonts;

  beforeAll(async () => {
    const fileSource = await getTestDataAsFileBuffer(filename);
    const [testDocx, testMedia, testMediaFiles, testFonts] = await Editor.loadXmlData(fileSource);

    docx = testDocx;
    media = testMedia;
    mediaFiles = testMediaFiles;
    fonts = testFonts;
  });

  beforeEach(() => {
    editor = new Editor({
      mode: 'docx',
      documentId: 'test',
      role: 'editor',
      documentMode: 'editing',
      isHeadless: true,
      extensions: getStarterExtensions(),
      content: docx,
      media,
      mediaFiles,
      fonts,
      users: [],
    });  
  });

  it('can import first element in custom list', () => {
    const state = editor.getJSON();
    const content = state.content;
    expect(content.length).toBe(1);

    const firstList = content[0];
    expect(firstList.type).toBe('orderedList');

    const { attrs: firstListAttrs } = firstList;
    expect(firstListAttrs).toBeDefined();
    expect(firstListAttrs.listId).toBe("4");
    expect(firstListAttrs.order).toBe(1);
  });
  
  it('can import the first sub-element (1.1)', () => {
    const state = editor.getJSON();
    const content = state.content[0].content;
    expect(content.length).toBe(1);

    const listItem = content[0].content;
    const firstSubListItem = listItem[1].content[0];
    const { attrs } = firstSubListItem;
    const lvlText = attrs.lvlText;
    expect(lvlText).toBe("%1.%2.");

    // We expect the list level to be [1, 1]
    const listLevel = attrs.listLevel;
    expect(listLevel).toStrictEqual([1, 1]);
  });

  it('can import the second sub-element (1.2)', () => {
    const state = editor.getJSON();
    const content = state.content[0].content;
    const listItem = content[0].content;
    const subItem = listItem[1].content[1];

    const { attrs } = subItem;
    const lvlText = attrs.lvlText;
    expect(lvlText).toBe("%1.%2.");

    // We expect the list level to be [1, 2]
    const listLevel = attrs.listLevel;
    expect(listLevel).toStrictEqual([1, 2]);
  });

  it('can import the sub-sub-element (1.2.1)', () => {
    const state = editor.getJSON();
    const content = state.content[0].content;
    const listItem = content[0].content;
    const subItem = listItem[1].content[1].content[1].content[0];

    const { attrs } = subItem;
    const lvlText = attrs.lvlText;
    expect(lvlText).toBe("%1.%2.%3.");

    // We expect the list level to be [1, 2, 1]
    const listLevel = attrs.listLevel;
    expect(listLevel).toStrictEqual([1, 2, 1]);
  });
});
