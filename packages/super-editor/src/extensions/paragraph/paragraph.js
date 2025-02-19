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

    const linkedStyle = getLinkedStyle(styleId, node, this.editor);
    if (linkedStyle) {
      const linkedStyleString = Object.entries(linkedStyle).map(([key, value]) => {
        if (key === 'textStyle') {
          return Object.entries(value).map(([k, v]) => {
            let newKey = kebabCase(k);
            return `${newKey}: ${v};`
          }).join(' ');
        }

        return `${key}: ${value};`;
      }).join(' ');

      if (!htmlAttributes.style) htmlAttributes.style = '';
      htmlAttributes.style += linkedStyleString;
    }

    const mergedAttrs = Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes);
    return ['p', mergedAttrs, 0];
  },
});

export const hasPageBreak = (styleId, editor) => {
  const linkedStyles = editor.converter?.linkedStyles || [];
  if (styleId && linkedStyles.length) {
    const linkedStyle = linkedStyles.find((style) => style.id === styleId);
    const pageBreak = linkedStyle.style.pageBreakBefore;
    const isPageBreak = pageBreak && pageBreak.attributes?.['w:val'] != 0;
    return isPageBreak;
  };
};

/**
 * Generate the linked style from the styleId
 * 
 * @param {string} styleId The styleId of the linked style
 * @param {Editor} editor The editor instance
 * @returns {string} The linked style
 */
export const getLinkedStyle = (styleId, node, editor) => {
  const linkedStyles = editor.converter?.linkedStyles || [];
  const markValue = {};

  if (styleId && linkedStyles.length) {
    const linkedStyle = linkedStyles.find((style) => style.id === styleId);
    Object.entries(linkedStyle.style.marks).forEach(([key, value]) => {
      const mark = node.marks.find((n) => n.type.name === value.type);
  
      if (!mark) {
        const { type } = value;
        if (type === 'bold') {
          markValue['font-weight'] = 'bold';
        } else {
          markValue[type] = value.attrs;
        }
      } else if (mark.type.name === 'textStyle') {
        if (!markValue.textStyle) markValue.textStyle = {};

        const newAttrs = { ...mark.attrs };
        Object.entries(mark.attrs).forEach(([key, markValue]) => {
          if (markValue || !value.attrs[key]) return;
          newAttrs[key] = value.attrs[key];
        });
        markValue.textStyle = newAttrs;
      }
    });
  };
  return markValue;
};
