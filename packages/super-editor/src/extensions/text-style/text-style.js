import { Mark, Attribute } from '@core/index.js';

export const TextStyle = Mark.create({
  name: 'textStyle',

  addOptions() {
    return {
      htmlAttributes: {},
    }
  },

  parseDOM() {
    return [{
      tag: 'span',
      getAttrs: (el) => {
        const hasStyles = el.hasAttribute('style');
          if (!hasStyles) return false;
          return {};
        },
    }];
  },

  renderDOM({ htmlAttributes }) {
    return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addCommands() {
    return {
      removeEmptyTextStyle: () => ({ state, commands }) => {
        const attributes = Attribute.getMarkAttributes(state, this.type);
        const hasStyles = Object.entries(attributes).some(([, value]) => !!value);
        if (hasStyles) return true;
        return commands.unsetMark(this.name);
      },
    }
  },
});
