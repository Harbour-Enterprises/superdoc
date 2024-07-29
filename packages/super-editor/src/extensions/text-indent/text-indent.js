import { Mark } from '@core/index.js';

export const TextIndent = Mark.create({
  name: 'textIndent',

  parseDOM() {
    return [
      { tag: 'p' },
    ];
  },


  renderDOM(node) {
    console.debug('TEXT INDENT', node.mark.attrs);
    return ['p', node.mark.attrs.attributes, 0];
  },

  addAttributes(){
    return {
      attributes: {
        style: {default: null},
      },
      indent: {default: null},
    }
  },

  addCommands() {
    return {
      changeTextIndent: (indent) => ({ commands }) => {
        const attrs = {
          attributes: {
            style: 'text-indent: 1em'
          },
          indent: '1em'
        }
        return commands.toggleMark(this.name, attrs);
      },
    };
  },
});
