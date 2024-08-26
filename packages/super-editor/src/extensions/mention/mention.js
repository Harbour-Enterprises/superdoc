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
        class: 'superdoc-at-mention',
      },
    };
  },

  parseDOM() {
    return [{
      tag: `span[data-type="${this.name}"]`,
      getAttrs: (node) => ({
        name: node.getAttribute('name') || null,
      }),
    }];
  },

  renderDOM({ node, htmlAttributes }) {
    const { name, email } = node.attrs;

    return ['span', Attribute.mergeAttributes(
      { 'data-type': this.name, },
      this.options.htmlAttributes,
      htmlAttributes,
    ), `@${name}`];
  },
  
  addAttributes() {
    return {
      name: { default: null, },
    }
  }
});
