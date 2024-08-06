import { Extension } from '@core/index.js';
import { parseSizeUnit } from '@core/utilities/index.js';

/**
 * Do we need a unit conversion system?
 * 'text-indent' or 'margin-left' for indentation.
 * 
 * For reference.
 * https://remirror.vercel.app/?path=/story/extensions-nodeformatting--basic
 * https://github.com/remirror/remirror/tree/HEAD/packages/remirror__extension-node-formatting
 */
export const TextIndent = Extension.create({
  name: 'textIndent',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      defaults: {
        unit: 'in',
        increment: 0.125,
      },
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textIndent: {
            default: null,
            parseDOM: (el) => el.style.textIndent,
            renderDOM: (attrs) => {
              if (!attrs.textIndent) return {};
              const [value, unit] = parseSizeUnit(attrs.textIndent);
              const textIndent = `${value}${unit ? unit : this.options.defaults.unit}`;
              return { style: `text-indent: ${textIndent}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextIndent: (indent) => ({ commands }) => {
        if (!indent) return false;

        return this.options.types
          .map((type) => commands.updateAttributes(type, { textIndent: indent }))
          .every((result) => result);
      },

      unsetTextIndent: () => ({ commands }) => {
        return this.options.types
          .map((type) => commands.resetAttributes(type, 'textIndent'))
          .every((result) => result);
      },

      // TODO
      increaseTextIndent: () => ({ commands }) => {
        return this.options.types
          .map((type) => {
            const { textIndent } = this.editor.getAttributes(type);

            if (!textIndent) {
              const { increment, unit } = this.options.defaults;
              return commands.updateAttributes(type, { 
                textIndent: `${increment}${unit}`,
              });
            }

            const [value, unit] = parseSizeUnit(textIndent);
            const newValue = value + this.options.defaults.increment;

            return commands.updateAttributes(type, { 
              textIndent: `${newValue}${unit ? unit : this.options.defaults.unit}`,
            });
          })
          .every((result) => result);
      },

      // TODO
      decreaseTextIndent: () => ({ commands }) => {
        return this.options.types
          .map((type) => {
            const { textIndent } = this.editor.getAttributes(type);
            
            if (!textIndent) return false;

            const [value, unit] = parseSizeUnit(textIndent);
            const newValue = value - this.options.defaults.increment;

            if (newValue <= 0) {
              return commands.unsetTextIndent();
            }

            return commands.updateAttributes(type, { 
              textIndent: `${newValue}${unit ? unit : this.options.defaults.unit}`,
            });
          })
          .every((result) => result);
      },
    };
  },
});
