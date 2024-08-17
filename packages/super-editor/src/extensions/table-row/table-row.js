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
      borders: {
        renderDOM({ borders = {} }) {
          const style = Object.entries(borders).reduce((acc, [key, { size, color }]) => {
            return `${acc}border-${key}: ${size}px solid ${color || 'black'};`;
          }, '');
          return { style }
        }
      },
      rowHeight: {
        renderDOM({ rowHeight }) {
          console.debug('rowHeight', rowHeight);
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
