import { Node, Attribute } from '@core/index.js';
import { style } from '../../core/config/style';

export const Paragraph = Node.create({
  name: 'paragraph',

  priority: 1000,

  group: 'block',

  content: 'inline*',

  inline: false,

  addOptions() {
    return {
      htmlAttributes: {},
    };
  },

  addAttributes() {
    return {
      paragraphSpacing: {
        renderDOM: (attrs) => {
          const { paragraphSpacing } = attrs;
          console.debug('\n\n\n SPACING NODE', attrs)
          if (!paragraphSpacing) return {};

          const { lineSpaceBefore, lineSpaceAfter } = paragraphSpacing;
          const style = `
            ${lineSpaceBefore ? `margin-top: ${lineSpaceBefore}px;` : ''}
            ${lineSpaceAfter ? `margin-bottom: ${lineSpaceAfter}px;` : ''}
          `.trim();
          
          if (style) return { style }
          return { };
        },
      },

      styleId: { rendered: false, },
      attributes: {
        rendered: false,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'p' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['p', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },
});
