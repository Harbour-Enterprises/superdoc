import { Node } from '@core/index.js';

export const CommentRangeStart = Node.create({
  name: 'commentRangeStart',

  group: 'inline',

  content: 'text*',

  inline: true,

  parseDOM() {
    return [{ tag: 'commentRangeStart' }];
  },

  renderDOM() {
    return ['commentRangeStart', 0];
  },

  addAttributes() {
    return {
      'w:id': { default: null },
    };
  },
});

export const CommentRangeEnd = Node.create({
  name: 'commentRangeEnd',

  group: 'inline',

  content: 'text*',

  inline: true,

  parseDOM() {
    return [{ tag: 'commentRangeEnd' }];
  },

  renderDOM() {
    return ['commentRangeEnd', 0]; 
  },

  addAttributes() {
    return {
      'w:id': { default: null },
    };
  },
});

export const CommentReference = Node.create({
  name: 'commentReference',

  group: 'inline',

  content: 'text*',

  inline: true,

  parseDOM() {
    return [{ tag: "commentReference" }];
  },

  renderDOM() {
    return ['commentReference', 0];
  },

  addAttributes() {
    return {
      attributes: {
        rendered: false,
      },
    };
  },
});
