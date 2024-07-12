import { Mark } from '@core/index.js';
import { toggleMark } from 'prosemirror-commands';

export const Color = Mark.create({
  name: 'color',

  parseDOM() {
    return [
      { tag: 'span' },
      // { style: 'text-decoration=underline' },
      // { style: 'text-decoration=auto', clearMark: m => m.type.name == 'u' },
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
      toggleColor: (color) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: `color: ${color};`,
          }
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
