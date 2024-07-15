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

  addAttributes(){
    return {
      attributes: {
        style: {default: null},
      }
    }
  },

  addCommands(node) {
    return {
      toggleFont: ({label, value}) => ({ commands }) => {
        console.debug('toggleFont', value, commands);
        const attrs = {
          attributes: {
            style: `font-family: ${value}`
          },
          font: label
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },

  addShortcuts() {
    return {
      // 'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
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
