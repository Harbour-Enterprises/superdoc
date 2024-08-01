import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';

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

      textAlign: {
        renderDOM: ({ textAlign }) => {
          if (!textAlign) return {};
          return { style: `text-align: ${textAlign}` };
        },
      },

      textIndent: {
        renderDOM: ({ textIndent }) => {
          if (!textIndent) return {};
          return { style: `text-indent: ${textIndent}` };
        },
      },
    };
  },

  renderDOM({ htmlAttributes }) {
    return ['p', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

});
