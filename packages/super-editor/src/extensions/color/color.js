import { Mark } from '@core/index.js';

export const Color = Mark.create({
  name: 'color',

  parseDOM() {
    return [
      { tag: 'span' },
      // { style: 'text-decoration=underline' },
      // { style: 'text-decoration=auto', clearMark: m => m.type.name == 'u' },
    ];
  },

  renderDOM() {
    return ['span', 0];
  },

  addCommands() {
    return {
      toggleColor: () => ({ commands }) => {
        return commands.toggleMark(this.name, {attributes: {style: 'color: red;'}});
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
  },
});
