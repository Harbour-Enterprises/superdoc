import { Mark } from '@core/index.js';

export const Underline = Mark.create({
  name: 'underline',

  parseDOM() {
    return [
      { tag: 'u' },
      { style: 'text-decoration=underline' },
      { style: 'text-decoration=auto', clearMark: m => m.type.name == 'u' },
    ];
  },

  renderDOM() {
    return ['u', 0];
  },

  addCommands() {
    return {
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
  },
});
