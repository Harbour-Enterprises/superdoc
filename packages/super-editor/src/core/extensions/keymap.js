import { Extension } from '../Extension.js';

// TODO:Artem - Need to handle keymap properly.

export const Keymap = Extension.create({
  name: 'keymap',

  addShortcuts() { 
    const keymap = {
      'Enter': () => this.editor.commands.enter(),
    };

    return keymap;
  },
});
 