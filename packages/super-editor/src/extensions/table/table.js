import { Node, Attribute } from '@core/index.js';
import { callOrGet } from '@core/utilities/callOrGet.js';
import { getExtensionConfigField } from '@core/helpers/getExtensionConfigField.js';
import { /* TableView */ createTableView } from './TableView.js';
import { createTable } from './tableHelpers/createTable.js';
import { createColGroup } from './tableHelpers/createColGroup.js';
import { deleteTableWhenSelected } from './tableHelpers/deleteTableWhenSelected.js';
import { createTableBordersDefault } from './tableHelpers/createTableBordersDefault.js';
import { TextSelection } from 'prosemirror-state';
import {
  addColumnBefore,
  addColumnAfter,
  addRowBefore,
  addRowAfter,
  CellSelection,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  fixTables,
  goToNextCell,
  mergeCells,
  setCellAttr,
  splitCell,
  tableEditing,
  toggleHeader,
  toggleHeaderCell,
  // TableView,
} from 'prosemirror-tables';

export const Table = Node.create({
  name: 'table',

  content: 'tableRow+',

  group: 'block',

  isolating: true,

  tableRole: 'table',

  addOptions() {
    return {
      htmlAttributes: {},
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 25,
      lastColumnResizable: true,
      allowTableNodeSelection: false,
    };
  },

  addAttributes() {
    return {
      /* tableWidth: {
        renderDOM: ({ tableWidth }) => {
          if (!tableWidth) return {};
          const { width, type = 'auto' } = tableWidth;
          return { 
            style: `width: ${width}px` 
          };
        },
      }, */

      tableIndent: {
        renderDOM: ({ tableIndent }) => {
          if (!tableIndent) return {};
          const { width, type = 'dxa' } = tableIndent;
          let style = '';
          if (width) style += `margin-left: ${width}px`;
          return { 
            style, 
          };
        },
      },

      borders: {
        default: () => createTableBordersDefault(),
        renderDOM({ borders }) {
          if (!borders) return {};
          const style = Object.entries(borders).reduce(
            (acc, [key, { size, color }]) => {
              return `${acc}border-${key}: ${size}px solid ${color || 'black'};`;
            }, 
            ''
          );

          return { 
            style, 
          };
        },
      },

      borderCollapse: {
        default: null,
        renderDOM({ borderCollapse }) {
          return { 
            style: `border-collapse: ${borderCollapse || 'collapse'}`, 
          };
        },
      },

      tableStyleId: { 
        rendered: false, 
      },

      tableLayout: { 
        rendered: false 
      },

      tableCellSpacing: {
        default: null,
        rendered: false,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'table' }];
  },

  renderDOM({ node, htmlAttributes }) {
    const { colgroup, tableWidth, tableMinWidth } = createColGroup(
      node,
      this.options.cellMinWidth,
    );

    const attrs = Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes, {
      style: tableWidth 
        ? `width: ${tableWidth}` 
        : `min-width: ${tableMinWidth}`,
    });

    const table =  [
      'table', 
      attrs, 
      colgroup, 
      ['tbody', 0],
    ];

    return table;
  },

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = false } = {}) => ({ tr, dispatch, editor }) => {
          const node = createTable(editor.schema, rows, cols, withHeaderRow);

          if (dispatch) {
            const offset = tr.selection.from + 1;
            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)));
          }
          
          return true;
        },

      deleteTable:
        () => ({ state, dispatch }) => {
          return deleteTable(state, dispatch);
        },

      addColumnBefore:
        () => ({ state, dispatch }) => {
          return addColumnBefore(state, dispatch);
        },

      addColumnAfter:
        () => ({ state, dispatch }) => {
          return addColumnAfter(state, dispatch);
        },

      deleteColumn:
        () => ({ state, dispatch }) => {
          return deleteColumn(state, dispatch);
        },

      addRowBefore:
        () => ({ state, dispatch }) => {
          return addRowBefore(state, dispatch);
        },

      addRowAfter:
        () => ({ state, dispatch }) => {
          return addRowAfter(state, dispatch);
        },

      deleteRow:
        () => ({ state, dispatch }) => {
          return deleteRow(state, dispatch);
        },

      mergeCells:
        () => ({ state, dispatch }) => {
          return mergeCells(state, dispatch);
        },

      splitCell:
        () => ({ state, dispatch }) => {
          return splitCell(state, dispatch);
        },

      mergeOrSplit:
        () => ({ state, dispatch }) => {
          if (mergeCells(state, dispatch)) {
            return true;
          }

          return splitCell(state, dispatch);
        },

      toggleHeaderColumn:
        () => ({ state, dispatch }) => {
          return toggleHeader('column')(state, dispatch);
        },

      toggleHeaderRow:
        () => ({ state, dispatch }) => {
          return toggleHeader('row')(state, dispatch);
        },

      toggleHeaderCell:
        () => ({ state, dispatch }) => {
          return toggleHeaderCell(state, dispatch);
        },

      setCellAttr:
        (name, value) => ({ state, dispatch }) => {
          return setCellAttr(name, value)(state, dispatch);
        },

      goToNextCell:
        () => ({ state, dispatch }) => {
          return goToNextCell(1)(state, dispatch);
        },

      goToPreviousCell:
        () => ({ state, dispatch }) => {
          return goToNextCell(-1)(state, dispatch);
        },

      fixTables:
        () => ({ state, dispatch }) => {
          if (dispatch) {
            fixTables(state);
          }

          return true;
        },

      setCellSelection:
        (pos) => ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setSelection(CellSelection.create(tr.doc, pos.anchorCell, pos.headCell));
          }

          return true;
        },
    };
  },

  addShortcuts() {
    return {
      Tab: () => {
        if (this.editor.commands.goToNextCell()) {
          return true;
        }
        if (!this.editor.can().addRowAfter()) {
          return false;
        }
        return this.editor.chain().addRowAfter().goToNextCell().run();
      },
      'Shift-Tab': () => this.editor.commands.goToPreviousCell(),
      Backspace: deleteTableWhenSelected,
      'Mod-Backspace': deleteTableWhenSelected,
      Delete: deleteTableWhenSelected,
      'Mod-Delete': deleteTableWhenSelected,
    };
  },

  addPmPlugins() {
    const resizable = this.options.resizable && this.editor.isEditable;

    return [
      ...(resizable
        ? [
          columnResizing({
            handleWidth: this.options.handleWidth,
            cellMinWidth: this.options.cellMinWidth,
            defaultCellMinWidth: this.options.cellMinWidth,
            lastColumnResizable: this.options.lastColumnResizable,
            View: createTableView({
              editor: this.editor,
            }),
          }),
        ] 
        : []),
        
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
    ];
  },

  extendNodeSchema(extension) {
    return {
      tableRole: callOrGet(getExtensionConfigField(extension, 'tableRole', {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
      })),
    };
  },
});
