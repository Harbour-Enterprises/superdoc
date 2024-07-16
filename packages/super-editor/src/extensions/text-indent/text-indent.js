import { Mark } from '@core/index.js';

export const TextIndent = Mark.create({
  name: 'textIndent',

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
      changeTextIndent: (indent) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `text-indent: ${indent}`
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
