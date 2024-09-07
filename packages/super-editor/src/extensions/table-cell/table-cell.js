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
        renderDOM: ({ width }) => {
          if (!width) return {};
          const style = `width: ${width}in`;
          return { style };
        },
      },
      colspan: { default: 1, },
      rowspan: { default: 1, },
      background: {
        renderDOM ({ background }) {
          if (!background) return {};
          const { color } = background || {};
          const style = `background-color: #${color || 'transparent'}`;
          return { style };
        }
      },
      verticalAlign: { 
        renderDOM({ verticalAlign }) {
          if (!verticalAlign) return {};
          const style = `vertical-align: ${verticalAlign}`;
          return { style };
        }
      },
      cellMargins: {
        renderDOM({ cellMargins }) {
          if (!cellMargins) return {};
          console.debug('\n\n CELL MARGINS XX', cellMargins, '\n\n');
          let style = '';
          const { top, right, bottom, left } = cellMargins || {};
          if (top) style += `padding-top: ${top}px;`;
          if (right) style += `padding-right: ${right}px;`;
          if (bottom) style += `padding-bottom: ${bottom}px;`;
          if (left) style += `padding-left: ${left}px;`;
          return { style };
        }
      }
    }
  },
});
