import { Node } from '@core/index.js';

export const Paragraph = Node.create({
  name: 'paragraph',

  group: 'block',

  content: 'inline*',

  inline: false,

  parseDOM() {
    return [{ tag: 'p' }];
  },

  renderDOM() {
    return ['p', 0];
  },
});
