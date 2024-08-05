import { Extension } from '@core/index.js';
import { parseSizeUnit } from '@core/utilities/index.js';

/**
 * Do we need a unit conversion system?
 * 
 * For reference.
 * https://github.com/remirror/remirror/tree/HEAD/packages/remirror__extension-font-size
 * https://github.com/remirror/remirror/blob/83adfa93f9a320b6146b8011790f27096af9340b/packages/remirror__core-utils/src/dom-utils.ts
 */
export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
      defaults: {
        unit: 'pt',
      },
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseDOM: (el) => el.style.fontSize,
            renderDOM: (attrs) => {
              if (!attrs.fontSize) return {};
              const [value, unit] = parseSizeUnit(attrs.fontSize);
              const fontSize = `${value}${unit ? unit : this.options.defaults.unit}`;
              return { style: `font-size: ${fontSize}` };
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        if (!fontSize) return false;
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },

      unsetColor: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
