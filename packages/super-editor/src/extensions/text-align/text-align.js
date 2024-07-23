import { Mark } from '@core/index.js';

export const TextAlign = Mark.create({
  name: 'textAlign',

  parseDOM() {
    return [
      { tag: 'p' },
    ];
  },


  renderDOM(node) {
    return ['p', node.mark.attrs.attributes, 0];
  },

  addAttributes(){
    return {
      attributes: {
        style: {default: null},
      },
      alignment: {default: null},
    }
  },

  addCommands(node) {
    return {
      changeTextAlignment: (alignment) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `text-align: ${alignment}`
          },
          alignment
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
