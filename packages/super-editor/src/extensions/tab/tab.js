import { Node, Attribute } from '@core/index.js';

export const TabNode = Node.create({
  name: 'tab',

  content: 'inline*',

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },

  renderDOM({ htmlAttributes }) {
    return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      tabSize: {
        renderDOM: ({ tabSize }) => {
          if (!tabSize) return {};
          const style = `width: ${tabSize}px; display: inline-block;`;
          return { style };
        },
      },
    };
  },

});
