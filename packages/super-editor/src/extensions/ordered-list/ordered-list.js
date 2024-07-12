import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';
import { toKebabCase } from '@common/key-transform.js';

export const OrderedList = Node.create({
  name: 'orderedList',

  group: 'block list',

  content: 'listItem+',

  addOptions() {
    return {
      htmlAttributes: {
        class: 'ordered-list',
        // for testing
        'data-test-attr': 'some-value',
      },
    }
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
          let listStyleType = 'decimal';
          if ('list-style-type' in attrs) listStyleType = toKebabCase(attrs['list-style-type']);
          return {
            style: `list-style-type: ${listStyleType}`,
          }
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
});
