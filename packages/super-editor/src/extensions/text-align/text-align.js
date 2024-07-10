import { Mark } from '@core/index.js';

export const TextAlign = Mark.create({
  name: 'textAlign',

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
      changeTextAlignment: (alignment) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `text-align: ${alignment}`
          }
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },

  addShortcuts() {
    return {
      // 'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      // 'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      // 'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      // 'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    }
  },
});
