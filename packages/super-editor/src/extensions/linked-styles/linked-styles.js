import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Extension } from '@core/Extension.js';
import { kebabCase } from '@harbour-enterprises/common';

export const LinkedStylesPluginKey = new PluginKey('linkedStyles');

export const LinkedStyles = Extension.create({
  name: 'linkedStyles',

  addPmPlugins() {
    return [createLinkedStylesPlugin(this.editor)];
  }

});

/**
 * The linked styles plugin
 */
const createLinkedStylesPlugin = (editor) => {
  return new Plugin({
    key: LinkedStylesPluginKey,
    state: {
      init(_, { doc, selection }) {
        if (!editor.converter) return;
        const styles = editor.converter?.linkedStyles || [];
        return {
          styles,
          decorations: generateDecorations(editor.state?.doc, styles),
        };
      },
      apply(tr, prev, oldEditorState, newEditorState) {
        let decorations = prev.decorations || DecorationSet.empty;
        if (tr.docChanged) {
          const styles = LinkedStylesPluginKey.getState(state).styles;
          decorations = generateDecorations(newEditorState.doc, styles);
        }

        return { ...prev, decorations };
      },
    },
    props: {
      decorations(state) {
        return LinkedStylesPluginKey.getState(state)?.decorations;
      }
    }
  })
};

/**
 * Generate style decorations for linked styles
 * 
 * @param {Object} doc The current document object
 * @param {Array[Object]} styles The linked styles
 * @returns {DecorationSet} The decorations
 */
const generateDecorations = (doc, styles) => {
  const decorations = [];
  let lastStyleId = null;
  doc.descendants((node, pos) => {
    const { name } = node.type;

    // Track the current StyleId
    if (node?.attrs?.styleId) lastStyleId = node.attrs.styleId;
    if (name === 'paragraph' && !node.attrs?.styleId) lastStyleId = null;
    if (name !== 'text') return;

    const linkedStyle = getLinkedStyle(lastStyleId, styles);
    if (!linkedStyle) return;

    const styleString = generateStyleString(linkedStyle, node);
    if (!styleString) return;

    const decoration = Decoration.inline(pos, pos + node.nodeSize, { style: styleString });
    decorations.push(decoration);
  });
  return DecorationSet.create(doc, decorations);
};

/**
 * Convert the linked styles and current node marks into a decoration string
 * If the node contains a given mark, we don't override it with the linked style per MS Word behavior
 * 
 * @param {Object} linkedStyle The linked style object
 * @param {Object} node The current node
 * @returns {String} The style string
 */
const generateStyleString = (linkedStyle, node) => {
  if (!linkedStyle?.definition?.styles) return '';
  const markValue = {};

  Object.entries(linkedStyle.definition.styles).forEach(([k, value]) => {
    const key = kebabCase(k);  
    const flattenedMarks = [];

    // Flatten node marks (including text styles) for comparison
    node.marks.forEach((n) => {
      if (n.type.name === 'textStyle') {
        Object.entries(n.attrs).forEach(([styleKey, value]) => {
          const parsedKey = kebabCase(styleKey);
          flattenedMarks.push({ key: parsedKey, value });
        });
        return;
      }

      flattenedMarks.push({ key: n.type.name, value: n.attrs[key] });
    });
    
    // Check if this node has the expected mark. If yes, we are not overriding it
    const mark = flattenedMarks.find((n) => n.key === key);

    // If no mark already in the node, we override the style
    if (!mark) {
      if (key === 'bold') {
        markValue['font-weight'] = 'bold';
      } else {
        markValue[key] = value;
      }
    }
  });

  return Object.entries(markValue).map(([key, value]) => `${key}: ${value}`).join(';');
};

/**
 * Get the (parsed) linked style from the styles.xml
 * 
 * @param {String} styleId The styleId of the linked style
 * @param {Array[Object]} styles The styles array
 * @returns {Object} The linked style
 */
const getLinkedStyle = (styleId, styles = []) => {
  return styles.find((style) => style.id === styleId);
};
