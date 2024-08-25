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
        style: 'display: inline-block;',
      },
      name: null,
    };
  },

  parseDOM() {
    return [{ tag: 'span["mention"]' }];
  },

  renderDOM({ node, htmlAttributes }) {
    const { name, email } = node.attrs;
    return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), `@${name}`];
  },
  
  addAttributes() {
    return {
      name: { default: null },
      email: { default: null },
      permissions: { default: [] },
    }
  },
});
