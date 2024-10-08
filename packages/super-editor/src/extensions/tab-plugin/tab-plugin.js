import { Extension } from '@core/Extension.js';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const tabPluginKey = new PluginKey('popoverPlugin');
export const TabPlugin = Extension.create({
  name: 'popoverPlugin',

  addPmPlugins() {
    console.debug('TabPlugin addPmPlugins');

    const view = this.editor.view;
    const tabPlugin = new Plugin({
      name: 'tabPlugin',
      key: tabPluginKey,
      props: {
        decorations(state) {
          const decorations = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name === "tab") {
              const width = calculateTabWidth(view);
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, { style: `width: ${width}px; background-color: red; display: inline-block;` })
              );
            }
          });
          return DecorationSet.create(state.doc, decorations);
        }
      }
    });
    return [tabPlugin];
  }
});

function calculateTabWidth(view) {
  const { from, to } = view.state.selection;
  const coords = view.coordsAtPos(from);
  const currentLeftOffset = coords.left;
  const nextTabStop = getNextTabStop(currentLeftOffset, 75);
  const tabWidth = nextTabStop - currentLeftOffset;
  console.debug('\n NEXT TAB', tabWidth, '\n')

  return tabWidth;
};

function getNextTabStop(currentPosition, tabWidth = 50) {
  return Math.ceil(currentPosition / tabWidth) * tabWidth;
}