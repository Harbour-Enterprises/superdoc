import { Node, Attribute } from '@core/index.js';
import { toKebabCase } from '@harbour-enterprises/common';
import { generateDocxListAttributes, findParentNode } from '@helpers/index.js';

export const OrderedList = Node.create({
  name: 'orderedList',

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`;
  },

  addOptions() {
    return {
      itemTypeName: 'listItem',
      htmlAttributes: {},
      keepMarks: true,
      listStyleTypes: ['decimal', 'lowerAlpha', 'lowerRoman'],
    };
  },

  addAttributes() {
    return {
      order: {
        default: 1,
        parseDOM: (element) => {
          return element.hasAttribute('start')
            ? parseInt(element.getAttribute('start') || '', 10)
            : 1;
        },
        renderDOM: (attrs) => {
          return {
            start: attrs.order,
          };
        },
      },

      'list-style-type': {
        default: 'decimal',
        renderDOM: (attrs) => {
          let listStyleType = attrs['list-style-type'];
          if (!listStyleType) return {};

          if (listStyleType === 'lowerLetter') {
            listStyleType = 'lowerAlpha';
          }

          return {
            style: `list-style-type: ${toKebabCase(listStyleType)};`,
          };
        }
      },

      attributes: {
        rendered: false,
        keepOnSplit: true,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'ol' }];
  },

  renderDOM({ htmlAttributes }) {
    const { start, ...restAttributes } = htmlAttributes;

    return start === 1
      ? ['ol', Attribute.mergeAttributes(this.options.htmlAttributes, restAttributes), 0]
      : ['ol', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addCommands() {
    return {
      toggleOrderedList: () => ({ commands }) => {    
        const attributes = generateDocxListAttributes('orderedList');  
        return commands.toggleList(
          this.name, 
          this.options.itemTypeName, 
          this.options.keepMarks,
          attributes,
        );
      },

      /**
       * Updates ordered list style type when sink or lift `listItem`.
       * @example 1,2,3 -> a,b,c -> i,ii,iii -> 1,2,3 -> etc
       */
      updateOrderedListStyleType: () => ({
        dispatch,
        state,
        tr,
      }) => {
        let list = findParentNode((node) => node.type.name === this.name)(state.selection);

        if (!list) {
          return false;
        }

        if (dispatch) {
          let listLevel = (list.depth - 1) / 2; // each list level increases depth by 2
          let listStyleTypes = this.options.listStyleTypes;
          let listStyle = listStyleTypes[listLevel % listStyleTypes.length];
          let currentListStyle = list.node.attrs['list-style-type'];
          let nodeAtPos = tr.doc.nodeAt(list.pos);

          if (currentListStyle !== listStyle && nodeAtPos.eq(list.node)) {
            tr.setNodeMarkup(list.pos, undefined, {
              ...list.node.attrs,
              ...{
                'list-style-type': listStyle,
              },
            });
          }
        }

        return true;
      },

      /**
       * Continue list numbering after `liftEmptyBlock` command.
       * @example
       * <ol start="1">
       *  <li>item</li>
       *  <li>item</li>
       * </ol>
       * <ol start="3">
       *  <li>item</li>
       *  <li>item</li>
       * </ol>
       */
      continueListNumberingAfterLiftEmpty: () => ({
        editor,
        dispatch,
        state,
        tr,
        commands,
      }) => {
        let list = findParentNode((node) => node.type.name === this.name)(state.selection);

        if (!list) {
          return false;
        }

        let canLiftEmptyBlock = editor.can().liftEmptyBlock();
        let isRootDepth = list.depth === 1;
        if (!canLiftEmptyBlock || !isRootDepth) return false;

        if (dispatch) {
          let { $from } = state.selection;
          // save pos before liftEmptyBlock command
          let prevListPos = $from.before(-2);

          if (!commands.liftEmptyBlock(state, dispatch)) {
            return false;
          }

          let { $to } = state.selection;
          let prevListNode = tr.doc.nodeAt(prevListPos);
          let newListPos = $to.after();
          let newListNode = tr.doc.nodeAt(newListPos);

          let isPrevOrderedList = prevListNode?.type.name === this.name;
          let isNewOrderedList = newListNode?.type.name === this.name;

          if (isPrevOrderedList && isNewOrderedList) {
            let lastOrder = prevListNode.attrs.order || 1;
            let lastIndex = prevListNode.childCount;
            let start = lastIndex + lastOrder;

            tr.setNodeMarkup(newListPos, undefined, {
              ...newListNode.attrs,
              order: start,
            });
          }
        }

        return true;
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Shift-7': () => {
        return this.editor.commands.toggleOrderedList();
      },
    };
  },

  // Input rules.
});
