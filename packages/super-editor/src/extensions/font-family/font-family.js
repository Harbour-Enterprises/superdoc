import { Mark } from '@core/index.js';

export const FontFamily = Mark.create({
  name: 'fontFamily',

  parseDOM() {
    return [
      { tag: 'span' },
    ];
  },


  renderDOM(node) {
    return ['span', node.mark.attrs.attributes, 0];
  },

  addCommands() {
    return {
      toggleFont: (argument) => ({ commands }) => {
        if (!argument) return;
        const {label, fontName, fontWeight} = argument;
        console.debug('toggleFont', label, fontName, fontWeight, commands);
        const styleDict = {
          'font-family': fontName,
          'font-weight': fontWeight,
        }
        const styleString = Object.entries(styleDict).map(([key, value]) => `${key}: ${value}`).join(';');

        const attrs = {
          attributes: {
            style: styleString
          },
          font: label
        }
        return commands.setMark(this.name, attrs);
      },
    };
  },

  addAttributes(){
    return {
      attributes: {
        style: {default: null},
      },
      font: {default: null},
    }
  }
});
