import { Mark } from '@core/index.js';

export const FontSize = Mark.create({
  name: 'fontSize',

  parseDOM() {
    return [
      { tag: 'span' },
    ];
  },

  renderDOM(node) {
    return ['span', node.mark.attrs.attributes, 0];
  },

  addAttributes(){
    return {
      attributes: {
        style: {default: null},
      }
    }
  },

  addCommands(node) {
    return {
      changeFontSize: (size) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `font-size: ${size}`
          }
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },
});
