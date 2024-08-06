import { Extension } from '@core/index.js';
import { parseSizeUnit } from '@core/utilities/index.js';

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      defaults: {
        unit: 'in',
      },
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseDOM: (el) => el.style.lineHeight,
            renderDOM: (attrs) => {
              if (!attrs.lineHeight) return {};
              let [value, unit] = parseSizeUnit(attrs.lineHeight);
              if (Number.isNaN(value)) return {};
              unit = unit ? unit : this.options.defaults.unit;
              return { style: `line-height: ${value}${unit}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ commands }) => {
        if (!lineHeight) return false;

        return this.options.types
          .map((type) => commands.updateAttributes(type, { lineHeight }))
          .every((result) => result);
      },

      unsetLineHeight: () => ({ commands }) => {
        return this.options.types
          .map((type) => commands.resetAttributes(type, 'lineHeight'))
          .every((result) => result);
      },
    };
  },
});
