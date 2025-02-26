import { Node, Attribute } from '@core/index.js';

export const TableCell = Node.create({
  name: 'tableCell',

  content: 'block+',

  tableRole: 'cell',

  isolating: true,

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },

  addAttributes() {
    return {
      colspan: { 
        default: 1, 
      },

      rowspan: {
        default: 1,
      },

      colwidth: {
        default: [100],
        parseDOM: (elem) => {
          const colwidth = elem.getAttribute('data-colwidth');
          const value = colwidth
            ? colwidth.split(',').map((width) => parseInt(width, 10))
            : null;
          return value;
        },
        renderDOM: (attrs) => {
          if (!attrs.colwidth) return {};
          return {
            'data-colwidth': attrs.colwidth,
          };
        },
      },

      /* width: {
        renderDOM: ({ width, widthType, widthUnit }) => {
          if (!width) return {};
          let unit = widthUnit === 'px' ? widthUnit : 'in';
          if (widthType === 'pct') unit = '%';
          const style = `width: ${width}${unit}`;
          return { style };
        },
      }, */
      
      background: {
        renderDOM({ background }) {
          if (!background) return {};
          const { color } = background || {};
          const style = `background-color: ${color ? `#${color}` : 'transparent'}`;
          return { style };
        },
      },

      verticalAlign: {
        renderDOM({ verticalAlign }) {
          if (!verticalAlign) return {};
          const style = `vertical-align: ${verticalAlign}`;
          return { style };
        },
      },

      cellMargins: {
        renderDOM({ cellMargins }) {
          if (!cellMargins) return {};
          const sides = ['top', 'right', 'bottom', 'left'];
          const style = sides
            .map((side) => {
              const margin = cellMargins?.[side];
              if (margin) return `padding-${side}: ${margin}px;`;
              return '';
            })
            .join(' ');
          return { style };
        },
      },

      borders: {
        default: () => createCellBordersDefault(),
        renderDOM({ borders }) {
          if (!borders) return {};
          const sides = ['top', 'right', 'bottom', 'left'];
          const style = sides
            .map((side) => {
              const border = borders?.[side];
              if (border && border.val === 'none') return `border-${side}: ${border.val};`;
              if (border) return `border-${side}: ${border.size}px solid ${border.color || 'black'};`;
              return '';
            })
            .join(' ');
          return { style };
        },
      },

      widthType: { 
        default: 'auto', 
        rendered: false, 
      },

      widthUnit: { 
        default: 'px', 
        rendered: false, 
      },

      mergedCells: {
        default: [],
        rendered: false,
      },

      vMerge: {
        rendered: false,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'td' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['td', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },
});

function createCellBordersDefault() {
  return {
    top: { size: 0.66665 },
    left: { size: 0.66665 },
    bottom: { size: 0.66665 },
    right: { size: 0.66665 },
  };
};
