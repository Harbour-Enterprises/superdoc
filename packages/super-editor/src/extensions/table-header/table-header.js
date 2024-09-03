import { Node, Attribute } from '@core/index.js';

export const TableHeader = Node.create({
  name: 'tableHeader',

  content: 'block+',

  tableRole: 'header_cell',

  isolating: true,

  parseDOM() {
    return [{ tag: 'th' }];
  },

  renderDOM({ htmlAttributes }) {
    const attributes = Attribute.mergeAttributes(
      this.options.htmlAttributes, 
      htmlAttributes,
    );
    return ['th', attributes, 0];
  },

  addAttributes() {
    return {
      colspan: { default: 1, },
      rowspan: { default: 1, },
      colwidth: {
        default: null,
        parseDOM: element => {
          const colwidth = element.getAttribute('colwidth')
          const value = colwidth ? [parseInt(colwidth, 10)] : null
          return value
        },
      },
    }
  },

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },

  addShortcuts() {
    return {
    };
  },

});
