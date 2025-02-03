import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Attribute } from '@core/index.js';
import { findChildren, getMarkType } from '@core/helpers/index.js';
import { parseSizeUnit } from '@core/utilities/index.js';

export function styledListMarker(options = {}) {
  return new Plugin({
    key: new PluginKey('styledListMarker'),

    state: {
      init(_, state) {
        const decorations = [
          ...getListMarkerDecorations(state),
          ...getListItemStylingFromParagraphProps(state),
        ];
        return DecorationSet.create(state.doc, decorations);
      },

      apply(tr, oldDecorationSet, oldState, newState) {
        if (!tr.docChanged) return oldDecorationSet;
        const decorations = [
          ...getListMarkerDecorations(newState),
          ...getListItemStylingFromParagraphProps(newState),
        ];
        return DecorationSet.create(newState.doc, decorations);
      },
    },

    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

function getListMarkerDecorations(state) {
  let { doc, storedMarks } = state;
  let decorations = [];

  let listItems = findChildren(doc, (node) => node.type.name === 'listItem');

  if (!listItems.length) {
    return decorations;
  }

  listItems.forEach(({ node, pos }) => {
    let textStyleMarks = [];
    let textStyleType = getMarkType('textStyle', doc.type.schema);
    let isEmptyListItem = checkListItemEmpty(node);

    if (isEmptyListItem && storedMarks) {
      let marks = storedMarks.filter((mark) => mark.type === textStyleType);
      textStyleMarks.push(...marks);
    } else {
      let marks = getListItemTextStyleMarks(node, doc, textStyleType);
      textStyleMarks.push(...marks);
    }

    let fontSize = null;
    let fontFamily = null;

    // We iterate over all found textStyle marks
    // and take the first style found.
    textStyleMarks.forEach((mark) => {
      let { attrs } = mark;

      if (attrs.fontSize && !fontSize) {
        let [value, unit] = parseSizeUnit(attrs.fontSize);
        if (!Number.isNaN(value)) {
          unit = unit ?? 'pt';
          fontSize = `${value}${unit}`;
        }
      }

      if (attrs.fontFamily && !fontFamily) {
        fontFamily = attrs.fontFamily;
      }
    });

    let fontSizeAttrs = {
      style: `--marker-font-size: ${fontSize ?? 'initial'}`,
    };
    let fontFamilyAttrs = {
      style: `--marker-font-family: ${fontFamily ?? 'initial'}`,
    };
    
    let attrs = Attribute.mergeAttributes(fontSizeAttrs, fontFamilyAttrs);

    let dec = Decoration.node(pos, pos + node.nodeSize, attrs);
    decorations.push(dec);
  });

  return decorations;
}

function getListItemStylingFromParagraphProps(state) {
  let { doc } = state;
  let decorations = [];
  let listItems = findChildren(doc, (node) => node.type.name === 'listItem');

  if (!listItems.length) {
    return decorations;
  }

  listItems.forEach(({ node, pos }) => {
    let spacingAttrs = {};
    
    if (node.attrs.spacing) {
      const { lineSpaceBefore, lineSpaceAfter, line } = node.attrs.spacing;
      const style = `
            ${lineSpaceBefore ? `margin-top: ${lineSpaceBefore}px;` : ''}
            ${lineSpaceAfter ? `margin-bottom: ${lineSpaceAfter}px;` : ''}
            ${line ? `line-height: ${line};` : ''}
          `.trim();
      
      spacingAttrs = {
        style
      };
    }

    let dec = Decoration.node(pos, pos + node.nodeSize, spacingAttrs);
    decorations.push(dec);
  });

  return decorations;
}

function getListItemTextStyleMarks(listItem, doc, markType) {
  let textStyleMarks = [];
  listItem.forEach((childNode) => {
    if (childNode.type.name !== 'paragraph') return;
    childNode.forEach((textNode) => {
      let isTextNode = textNode.type.name === 'text';
      let hasTextStyleMarks = markType.isInSet(textNode.marks);
      if (isTextNode && hasTextStyleMarks) {
        let marks = textNode.marks.filter((mark) => mark.type === markType);
        textStyleMarks.push(...marks);
      }
    });
  });
  return textStyleMarks;
}

function checkListItemEmpty(listItem) {
  return (
    listItem.childCount === 1 &&
    listItem.firstChild?.type.name === 'paragraph' &&
    listItem.firstChild?.content.size === 0
  );
}
