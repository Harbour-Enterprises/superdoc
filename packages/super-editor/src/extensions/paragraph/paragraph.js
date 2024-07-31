import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';

export const Paragraph = Node.create({
  name: 'paragraph',

  priority: 1000,

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

      paragraphSpacing: {
        renderDOM: (attrs) => {
          let { paragraphSpacing } = attrs;
          if (!paragraphSpacing) return;

          const { lineSpaceBefore, lineSpaceAfter } = paragraphSpacing;
          let style = '';
          if (lineSpaceBefore) style += `margin-top: ${lineSpaceBefore}px;`;
          if (lineSpaceAfter) style += `margin-bottom: ${lineSpaceAfter}px;`;
          return { style };
        },
      },

      attributes: {
        rendered: false,
      },
    };
  },

  renderDOM({htmlAttributes}) {
    const { style } = htmlAttributes;
    return ['p', { style: style }, 0];
  },
});
