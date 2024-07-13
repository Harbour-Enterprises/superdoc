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
      toggleFont: (font) => ({ commands }) => {
        console.debug('toggleFont', font, commands);
        const attrs = {
          attributes: {
            style: `font-family: Georgia, serif`
          }
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
});
