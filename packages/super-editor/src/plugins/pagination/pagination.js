import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const paginationPluginKey = new PluginKey('paginationPlugin');

export function pagination(editor) {

  return new Plugin({
    key: paginationPluginKey,
    state: {
      init() {
        return generatePagination(editor);
      },
      apply(tr, old) {
        const meta = tr.getMeta(paginationPluginKey);
        if (meta && meta.decorations) {
          return meta.decorations;
        }
        return old;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

function generatePagination(editor) {
  const { state, view } = editor;
  const decorations = [];
  const doc = state.doc;

  const pageHeight = 1056 + 130;
  const positions = getDecorationPositions(view, pageHeight);
  // const positions = [2756];
  // const coords = editor.view.coordsAtPos(2756);
  // console.debug('Coords:', coords.top);
  // console.debug('editor', editor.element.style.lineHeight);

  positions.forEach((pos) => {
    const widget = Decoration.widget(pos, createPageBreak());
    decorations.push(widget);
  });

  return DecorationSet.create(doc, decorations);
}

function getDecorationPositions(view, pageHeight) {
  const doc = view.state.doc;
  const positions = [];
  let lastFittingPosition = 0;
  const originalPageHeight = pageHeight;

  // Iterate through the document nodes
  doc.descendants((node, pos) => {
    const coords = view.coordsAtPos(pos);

    if (coords.bottom <= pageHeight) {
      lastFittingPosition = pos;
    } else {
      if (!positions.includes(lastFittingPosition - 1)) {
        positions.push(lastFittingPosition - 1);
        pageHeight += originalPageHeight - 96 * 3;
      }
      return false;
    }
  });

  return positions;
}

function createPageBreak() {
  const div = document.createElement('div');
  div.style.width = '8.5in';
  div.style.height = '2in';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.marginLeft = '-1in';

  const separator = document.createElement('div');
  separator.style.width = '100%';
  separator.style.height = '20px';
  separator.style.borderTop = '1px solid #999';
  separator.style.borderBottom = '1px solid #999';

  div.appendChild(separator);
  return div;
}
