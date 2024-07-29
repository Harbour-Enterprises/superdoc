import { Mark } from '@core/index.js';

export const Italic = Mark.create({
  name: 'italic',

  parseDOM() {
    return [
      { tag: 'i' }, 
      { tag: 'em' },
      { style: 'font-style=italic' },
      { style: 'font-style=normal', clearMark: m => m.type.name == 'em' },
    ];
  },

  renderDOM() {
    return ['em', 0];
  },

  addCommands() {
    return {
      toggleItalic: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-i': () => this.editor.commands.toggleItalic(),
      'Mod-I': () => this.editor.commands.toggleItalic(),
    };
  },
});
