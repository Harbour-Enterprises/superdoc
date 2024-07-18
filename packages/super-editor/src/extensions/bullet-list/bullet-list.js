import { Node } from '@core/index.js';

export const bulletedList = Node.create({
  name: 'bulletedList',

  group: 'block list',

  content: 'listItem+',

  parseDOM() {
    return [{ tag: "ul" }];
  },

  renderDOM() {
    return ['ul', 0];
  },

  addAttributes() {
    return {
      'list-style-type': {
        default: 'bullet',
        rendered: false,
      },
      attributes: {
        rendered: false,
      },
    };
  },
});
