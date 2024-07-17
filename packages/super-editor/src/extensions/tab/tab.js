import { Node } from '@core/index.js';

export const TabNode = Node.create({
  name: 'tab',

  group: 'block',

  content: 'inline*',

  renderDOM() {
    return ['span', 0];
  },

});
