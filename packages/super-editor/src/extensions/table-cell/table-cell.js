import { Node, Attribute } from '@core/index.js';

export const TableCell = Node.create({
  name: 'tableCell',

  content: 'block+',

  tableRole: 'cell',

  isolating: true,

  parseDOM() {
    return [{ tag: 'td' }];
  },

  addOptions() {
    return {
      htmlAttributes: {},
    }
  },

  renderDOM({ htmlAttributes }) {
    return ['td', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      width: {
        renderDOM: (attrs) => {
          const { width } = attrs;
          const style = `width: ${width}in;`;
          return { style };
        },
      },
      colspan: { default: 1, },
      rowspan: { default: 1, },
      background: {
        renderDOM ({ background }) {
          const { color } = background || {};
          const style = `background-color: #${color || 'transparent'};`;
          return { style };
        }
      }
      // colwidth: {
      //   default: '300px',
      //   renderDOM: element => {
      //     const colwidth = element.getAttribute('colwidth')
      //     const value = colwidth ? [parseInt(colwidth, 10)] : null
      //     return value
      //   },
      // },
    }
  },
});
