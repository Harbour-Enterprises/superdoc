import { Node } from '@core/index.js';

export const ListItem = Node.create({
  name: 'listItem',

  content: 'paragraph block*',

  parseDOM() {
    return [{ tag: 'li' }];
  },

  renderDOM() {
    return ['li', 0];
  },
  
  addAttributes() {
    return {
      start: { default: 1, rendered: false },

      // The DOCX character for this list item (ie: ●, ▪)
      lvlText: { default: '', rendered: false },

      // JC = justification. Expect left, right, center
      lvlJc: { default: '', rendered: false },

      // This will contain indentation and space info.
      // ie: w:left (left indent), w:hanging (hanging indent)
      listParagraphProperties: { default: {}, rendered: false },

      // This will contain run properties for the list item
      listRunProperties: { default: {}, rendered: false },
      
      attributes: {
        rendered: false,
      },
    };
  },

  defining: true,
});
