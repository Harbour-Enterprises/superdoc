import { Node, Attribute } from '@core/index.js';


export const Table = Node.create({
  name: 'table',

  group: 'block',

  content: 'tableRow+',

  tableRole: 'table',

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },

  parseDOM() {
    return [{ tag: 'table' }];
  },

  addAttributes() {
    return {
      tableWidth: { default: '100%', },
      tableWidthType: { default: 'auto', },  
      gridColumnWidths: { default: [], },
      tableStyleId: { rendered: false, },
      tableIndent: { rendered: false, },
      tableLayout: { rendered: false, },
      borders: {
        default: {},
        renderDOM({ borders = {} }) {
          if (!borders) return {};
          const style = Object.entries(borders).reduce((acc, [key, { size, color }]) => {
            return `${acc}border-${key}: ${size}px solid ${color || 'black'};`;
          }, 'border-collapse: collapse;');
          return { style }
        }
      },
    };
  },

  renderDOM({ htmlAttributes }) {
    const attributes = Attribute.mergeAttributes(
      this.options.htmlAttributes, 
      htmlAttributes,
    );
    return ['table', attributes, ['tbody', 0]];
  },

});
