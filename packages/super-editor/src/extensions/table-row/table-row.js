import { Node, Attribute } from '@core/index.js';

export const TableRow = Node.create({
  name: 'tableRow',

  content: '(tableCell | tableHeader)*',

  tableRole: 'row',

  parseDOM() {
    return [{ tag: 'tr' }];
  },

  renderDOM({ htmlAttributes }) {
    const attributes = Attribute.mergeAttributes(
      this.options.htmlAttributes, 
      htmlAttributes,
    );
    return ['tr', attributes, 0];
  },

  addAttributes() {
    return {
      rowHeight: {
        renderDOM({ rowHeight }) {
          if (!rowHeight) return {};
          const style = `height: ${rowHeight}px;`;
          return { style };
        },
      }
    };
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
