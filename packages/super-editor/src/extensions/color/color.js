import { Mark } from '@core/index.js';

export const Color = Mark.create({
  name: 'color',

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
      color: {default: null},
    }
  },

  addCommands(node) {
    return {
      toggleColor: (color) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `color: ${color};`,
          },
          color,
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
  },
});
