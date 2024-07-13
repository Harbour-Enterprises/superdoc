import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';

export const Paragraph = Node.create({
  name: 'paragraph',

  group: 'block',

  // If possible, we should force at least one run inside a paragraph
  // Will need special handling for 'enter' etc.
  content: 'inline*',

  inline: false,

  parseDOM() {
    return [{ tag: 'p' }];
  },

  addAttributes() {
    return {
      justification: {
        renderDOM: (attrs) => {
          console.debug('renderDOM', attrs.justification);
          let { justification } = attrs;
          return {
            style: `text-align: ${justification}`,
          };
        }
      },
      attributes: {
        rendered: false,
      },
    };
  },

  renderDOM({htmlAttributes}) {
    const { style } = htmlAttributes;
    console.debug('renderDOM', style);

    // return ['p', Attribute.mergeAttributes(this.options.htmlAttributes, restAttributes), 0]
    return ['p', { style: style }, 0];
  },
});
