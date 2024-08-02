import { Extension } from '@core/index.js';

export const FormatCommands = Extension.create({
  name: 'formatCommands',

  addOptions() {
    return {};
  },

  addCommands() {
    return {
      clearFormat: () => ({ chain }) => {
        return chain()
          .clearNodes()
          .unsetAllMarks()
          .run();
      },

      clearMarksFormat: () => ({ chain }) => {
        return chain()
          .unsetAllMarks()
          .run();
      },

      clearNodesFormat: () => ({ chain }) => {
        return chain()
          .clearNodes()
          .run();
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.clearFormat(),
    };
  },
});
