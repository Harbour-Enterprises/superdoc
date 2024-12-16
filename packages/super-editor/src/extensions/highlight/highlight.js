import { Mark, Attribute } from '@core/index.js';

export const Highlight = Mark.create({
  name: 'highlight',

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color') || element.style.backgroundColor,
        renderDOM: attributes => {
          if (!attributes.color) {
            return {}
          }

          return {
            'data-color': attributes.color,
            style: `background-color: ${attributes.color}; color: inherit`,
          }
        },
      },
    }
  },

  parseDOM() {
    return [
      { tag: 'mark' },
    ];
  },

  renderDOM({ htmlAttributes }) {
    return ['mark', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      toggleHighlight: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
    };
  },
});
