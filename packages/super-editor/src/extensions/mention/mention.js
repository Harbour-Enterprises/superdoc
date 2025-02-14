import { Node, Attribute } from '@core/index.js';

export const Mention = Node.create({
  name: 'mention',

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      htmlAttributes: {
        class: 'super-editor-mention',
      },
    };
  },

  parseDOM() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
        getAttrs: (node) => ({
          name: node.getAttribute('name') || null,
          email: node.getAttribute('email') || null,
        }),
      },
    ];
  },

  renderDOM({ node, htmlAttributes }) {
    const { name } = node.attrs;

    return [
      'span',
      Attribute.mergeAttributes({ 'data-type': this.name, }, this.options.htmlAttributes, htmlAttributes),
      `@${name}`,
    ];
  },

  addAttributes() {
    return {
      name: { default: null },
      email: { default: null },
    };
  },
});
