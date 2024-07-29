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
      toggleColor: (value) => ({ commands }) => {
        console.debug('toggleColor', value);
        const attrs = {
          attributes: {
            style: `color: ${value};`,
          },
          color: value,
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },
});
