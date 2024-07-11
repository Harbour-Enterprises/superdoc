import { Node } from '@core/index.js';

export const BulletList = Node.create({
  name: 'bulletList',

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
