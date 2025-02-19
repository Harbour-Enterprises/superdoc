import { Node, Attribute } from '@core/index.js';
import { kebabCase } from '@harbour-enterprises/common';
import { twipsToPixels } from '@converter/helpers.js';

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
      spacing: {
        renderDOM: (attrs) => {
          const { spacing } = attrs;
          if (!spacing) return {};

          const { lineSpaceBefore, lineSpaceAfter, line, lineRule } = spacing;
          const style = `
            ${lineSpaceBefore ? `margin-top: ${lineSpaceBefore}px;` : ''}
            ${lineSpaceAfter ? `margin-bottom: ${lineSpaceAfter}px;` : ''}
            ${line ? `line-height: ${line};` : ''}
          `.trim();

          if (style) return { style };
          return {};
        },
      },
      indent: {
        renderDOM: ({ indent }) => {
          if (!indent) return {};
          const { left, right, firstLine } = indent;

          let style = '';
          if (left) style += `margin-left: ${left}px;`;
          if (right) style += `margin-right: ${right}px;`;
          if (firstLine) style += `text-indent: ${firstLine}px;`;

          return { style };
        },
      },
      styleId: {
        rendered: false,
      },
      pageBreakBefore: {
        rendered: false,
      },
      attributes: {
        rendered: false,
      },
      filename: { rendered: false },
      rsidRDefault: { rendered: false },
    };
  },

  parseDOM() {
    return [{ tag: 'p' }];
  },

  renderDOM({ node, htmlAttributes }) {
    const { attrs = {} } = node;
    const { styleId } = attrs;

    const mergedAttrs = Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes);
    return ['p', mergedAttrs, 0];
  },
});
