import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';

const bulletTypes = {
  111: 'circle',
  61607: 'square',
  61623: 'disc',
  61656: '"\u27A2 "',
  61558: '"\u2756 "',
};

export const ListItem = Node.create({
  name: 'listItem',

  content: 'paragraph block*',

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
        renderDOM: (attrs) => {
          let lvlText = attrs?.lvlText;
          if (!lvlText) return {};

          let code = lvlText.codePointAt(0);
          let bulletType =  bulletTypes[code];
          if (!bulletType) return {};

          return {
            style: `list-style-type: ${bulletType};`,
          };
        },
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
      Tab: () => {
        return this.editor.commands.sinkListItem(this.name);
      },
      'Shift-Tab': () => {
        return this.editor.commands.liftListItem(this.name);
      },
    };
  },
});
