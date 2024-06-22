import { Mark } from '@core/index.js';

export const Strike = Mark.create({
  name: 'strike',

  parseDOM() {
    return [
      { tag: 's' },
      { style: 'text-decoration=line-through' },
      { style: 'text-decoration=auto', clearMark: m => m.type.name == 's' }
    ];
  },

  renderDOM() {
    return ['s', 0];
  },

  addCommands() {
    return {
      toggleStrike: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Shift-S': () => this.editor.commands.toggleStrike(),
    };
  },
});
