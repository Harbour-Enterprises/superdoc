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
      },
      fontSize: {default: null},
    }
  },

  addCommands(node) {
    return {
      changeFontSize: ({value}) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `font-size: ${value}pt`
          },
          fontSize: `${value}pt`,
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
