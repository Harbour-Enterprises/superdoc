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
      // 'w14:paraId': { default: null, rendered: false },
      // 'w14:textId': { default: null, rendered: false },
      // 'w:rsidR': { default: null, rendered: false },
      // 'w:rsidRDefault': { default: null, rendered: false },
      // paragraphProperties: {
      //   renderDOM: (attrs) => {
      //     // console.debug('\n\n PARAGRAPH PROPERTIES NODE ATTRS', attrs, '\n\n')
      //   }
      // },
      spacing: {
        default: null,
        renderDOM: (attrs) => {
          const { spacing } = attrs;
          if (!spacing) return {};

          const { lineSpaceBefore, lineSpaceAfter, line } = spacing;
          const style = `
            ${lineSpaceBefore ? `margin-top: ${lineSpaceBefore}px;` : ''}
            ${lineSpaceAfter ? `margin-bottom: ${lineSpaceAfter}px;` : ''}
            ${line ? `line-height: ${line}px;` : ''}
          `.trim();
          
          if (style) return { style }
          return { };
        },
      },
      indent: {
        default: null,
        renderDOM: ({ indent }) => {
          if (!indent) return {};
          const { left, right, firstLine } = indent;

          let style = '';
          if (left) style += `margin-left: ${left}px;`;
          if (right) style += `margin-right: ${right}px;`;
          if (firstLine) style += `text-indent: ${firstLine}px;`;

          return { style }
        }
      },
      styleId: { rendered: false, },
    };
  },

  parseDOM() {
    return [{ tag: 'p' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['p', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },
});
