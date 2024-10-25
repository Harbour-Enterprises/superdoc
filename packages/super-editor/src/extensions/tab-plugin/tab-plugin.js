import { Extension } from '@core/Extension.js';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const tabPluginKey = new PluginKey('tabPlugin');
export const TabPlugin = Extension.create({
  name: 'tabPlugin',

  addPmPlugins() {
    console.debug('TabPlugin addPmPlugins');

    const { view } = this.editor;
    const tabPlugin = new Plugin({
      name: 'tabPlugin',
      key: tabPluginKey,
      state: {
        init(_, state) {
          let decorations = getTabDecorations(state, view);
          return DecorationSet.create(state.doc, decorations);
        },

        apply(tr, oldDecorationSet, oldState, newState) {
          if (!tr.docChanged) return oldDecorationSet;
          const decorations = getTabDecorations(newState, view);
          return DecorationSet.create(newState.doc, decorations);
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        }
      }
    });
    return [tabPlugin];
  }
});

const tabWidthPx = 48;

const getTabDecorations = (state, view) => {
  let decorations = [];
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'tab') {
      let $pos = state.doc.resolve(pos);
      const prevNodeSize = $pos.nodeBefore?.nodeSize || 0;
      
      let textWidth = 0;
      
      view.state.doc.nodesBetween(pos - prevNodeSize - 1, pos - 1, (node, nodePos) => {
        if (node.isText && node.textContent !== ' ') {
          const textWidthForNode = calcTextWidth(view, nodePos);
          textWidth += textWidthForNode;
        }
      });
      
      const tabWidth = $pos.nodeBefore?.type.name === 'tab' ? tabWidthPx : tabWidthPx - textWidth % tabWidthPx;
      const tabHeight = calcTabHeight(view.nodeDOM(pos));
      
      decorations.push(
          Decoration.node(pos, pos + node.nodeSize, { style: `width: ${tabWidth}px; height: ${tabHeight};` })
      );
    }
  });
  return decorations;
};

function calcTextWidth(view, pos) {
  const domNode = view.nodeDOM(pos);
  if (domNode) {
    const range = document.createRange();
    range.selectNodeContents(domNode);
    return range.getBoundingClientRect().width;
  }
  return 0;
}

function calcTabHeight(node) {
  const parentNode = node?.parentNode;
  if (!node || !parentNode || !node.classList?.contains('tab')) return '0px';
  
  // getting line-height to support multi-lined text
  return window.getComputedStyle(node.parentElement, null).getPropertyValue('line-height');
}
