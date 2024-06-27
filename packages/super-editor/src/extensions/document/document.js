import { Node } from '@core/index.js';

export const Document = Node.create({
  name: 'doc',

  topNode: true,

  content: 'body',

  parseDOM() {
    return [{ tag: 'doc' }];
  },

  renderDOM() {
    return ['doc', 0];
  },
});
