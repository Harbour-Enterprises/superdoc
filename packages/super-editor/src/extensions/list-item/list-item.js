import { Node, Attribute } from '@core/index.js';

export const ListItem = Node.create({
  name: 'listItem',

  content: 'paragraph* block*',

  defining: true,

  addOptions() {
    return {
      htmlAttributes: {},
      bulletListTypeName: 'bulletList',
      orderedListTypeName: 'orderedList',
    };
  },

  parseDOM() {
    return [{ tag: 'li' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['li', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },
  
  addAttributes() {
    return {

      // The DOCX character for this list item (ie: ●, ▪)
      lvlText: { 
        default: null,
        rendered: false,
      },

      // JC = justification. Expect left, right, center
      lvlJc: { 
        default: null,
        rendered: false,
      },
      
      // This will contain indentation and space info.
      // ie: w:left (left indent), w:hanging (hanging indent)
      listParagraphProperties: { 
        default: null,
        rendered: false,
      },

      // This will contain run properties for the list item
      listRunProperties: { 
        default: null,
        rendered: false,
      },

      attributes: {
        rendered: false,
      },
    };
  },

  addShortcuts() {
    return {
      Enter: () => {
        return this.editor.commands.splitListItem(this.name);
      },
      'Shift-Enter': () => {
        return this.editor.commands.first(({ commands }) => [
          () => commands.createParagraphNear(),
          () => commands.splitBlock(),
        ]);
      },
      Tab: () => {
        return this.editor.chain()
          .sinkListItem(this.name)
          .updateOrderedListStyleType()
          .run();
      },
      'Shift-Tab': () => {
        return this.editor.chain()
          .liftListItem(this.name)
          .updateOrderedListStyleType()
          .run();
      },
    };
  },
});
