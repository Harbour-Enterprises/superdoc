import { Extension } from '../Extension.js';

// TODO:Artem - Need to create Keymap extension from scratch.

export const Keymap = Extension.create({
  name: 'keymap',

  addShortcuts() { 
    const keymap = {
      'Enter': () => this.editor.commands.enter(),
    };

    return keymap;
  },
});
 