import { Node, Attribute } from '@core/index.js';

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
          if (!paragraphSpacing) return {};

          const { lineSpaceBefore, lineSpaceAfter } = paragraphSpacing;
          const style = `
            ${lineSpaceBefore ? `margin-top: ${lineSpaceBefore.toFixed(2)}px;` : ''}
            ${lineSpaceAfter ? `margin-bottom: ${lineSpaceAfter.toFixed(2)}px;` : ''}
          `.trim();
          
          return { style };
        },
      },

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
