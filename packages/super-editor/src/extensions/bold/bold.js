import { Mark } from '@core/index.js';

export const Bold = Mark.create({
  name: 'bold',

  parseDOM() {
    return [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (node) => node.style.fontWeight != 'normal' && null },
      { style: 'font-weight=400', clearMark: m => m.type.name == 'strong' },
      { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
    ];
  },

  renderDOM() {
    return ['strong', 0];
  },

  addCommands() {
    return {
      toggleBold: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleBold(),
    };
  },
});
