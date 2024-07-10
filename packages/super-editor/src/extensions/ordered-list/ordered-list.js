import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';
import { toKebabCase } from '@common/key-transform.js';

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
      keepMarks: false,
      keepAttributes: false,
    };
  },

  addAttributes() {
    return {
      order: {
        default: 1,
        parseHTML: (element) => {
          return element.hasAttribute('start')
            ? parseInt(element.getAttribute('start') || '', 10)
            : 1;
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
      toggleOrderedList: () => (props) => {      
        const { commands, chain } = props;
        return commands.toggleList(
          this.name, 
          this.options.itemTypeName, 
          this.options.keepMarks,
        );
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
