import { Node, Attribute } from '@core/index.js';

export const LineBreak = Node.create({
  name: 'lineBreak',

  group: 'inline',

  inline: true,

  parseDOM() {
    return [{ tag: 'br' }];
  },

  renderDOM() {
    return ['br', {}, 0];
  },

  addAttributes() {
    return {
      lineBreakType: { default: null },
    }
  }
});
