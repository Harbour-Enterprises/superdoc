import { Node } from '@core/index.js';

export const ListItem = Node.create({
  name: 'listItem',

  content: 'paragraph block*',

  parseDOM() {
    return [{ tag: 'li' }];
  },

  renderDOM() {
    return ['li', 0];
  },

  defining: true,
});
