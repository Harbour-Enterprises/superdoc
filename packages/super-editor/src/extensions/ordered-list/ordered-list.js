import { Node } from '@core/index.js';

export const OrderedList = Node.create({
  name: 'orderedList',

  group: 'block list',

  content: 'listItem+',

  addAttributes() {
    return {
      order: {
        default: 1,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'ol' }];
  },

  renderDOM() {
    return ['ol', 0];
  },
});
