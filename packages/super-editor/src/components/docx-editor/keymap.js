import { keymap } from "prosemirror-keymap"
import { toggleMark } from "prosemirror-commands"
import { undo, redo } from "prosemirror-history"
import { chainCommands, splitBlock } from "prosemirror-commands";
import { DocxSchema } from '@schemas/docx-schema';
import SuperCommands from './commands';

export default function() {
  return keymap(
    {
      "Mod-z": undo,
      "Mod-shift-z": redo,
      "Mod-y": redo,
      "Mod-b": toggleMark(DocxSchema.marks.strong),
      "Mod-i": toggleMark(DocxSchema.marks.em),
      "Enter": chainCommands(SuperCommands.enter),

      // Just as an example
      "Mod-s": (state, dispatch) => {
        console.log('Mod-S pressed. State:', state);
        return true;
      },
    }
  );
}