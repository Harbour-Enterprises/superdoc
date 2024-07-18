import { Mark } from '@core/index.js';

export const Link = Mark.create({
  name: 'link',

  parseDOM() {
    return [
      { tag: 'a' },
    ];
  },

  renderDOM(node) {
    return ['a', node.mark.attrs.attributes, 0];
  },

  addAttributes(){
    return {
      attributes: {
        href: {default: null},
      },
      href: {default: null},
      text: {default: null},
    }
  },

  addCommands(node) {
    return {
      toggleLink: ({href, text}) => ({ commands }) => {
        const attrs = {
          attributes: {
            href
          },
          href,
          text
        }
                return commands.toggleMark(this.name, attrs);
      },
    };
  },

  addShortcuts() {
    return {
      // 'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
  }
});
