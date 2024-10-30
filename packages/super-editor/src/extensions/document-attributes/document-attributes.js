import { Node, Attribute } from '@core/index.js';

export const DocumentAttributes = Node.create({
  name: 'documentAttributes',

  group: 'block',

  content: '',

  inline: false,

  selectable: false,

  atom: true,

  addOptions() {
    return {
      htmlAttributes: {
        style: 'display: none',
        'data-type': 'documentAttributes'
      },
    }
  },

  addAttributes() {
    return {
      attributes: {
        renderDOM({ attributes }) {
          return attributes;
        }
      }
    }
  },

  parseDOM() {
    return [{ tag: "div[data-type='documentAtttributes'" }];
  },

  renderDOM({ htmlAttributes }) {
    return ['div', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

});
