import { Node } from '@core/index.js';
import { v4 as uuidv4 } from 'uuid';

export const CommentRangeStart = Node.create({
  name: 'commentRangeStart',

  group: 'inline',

  content: 'text*',

  inline: true,

  parseDOM() {
    return [{ tag: 'commentRangeStart' }];
  },

  renderDOM() {
    console.debug('\n\n\n COMMENT START RENDERED \n\n\n');
    return ['commentRangeStart', 0];
  },

  addAttributes() {
    return {
      'w:id': {
        rendered: false,
        default: () => uuidv4(),
      },
      internal: {
        default: true,
        rendered: false,
      },
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
      'w:id': {
        default: () => uuidv4(),
      },
    };
  },
});

export const CommentReference = Node.create({
  name: 'commentReference',

  group: 'inline',

  content: 'text*',

  inline: true,

  parseDOM() {
    return [{ tag: 'commentReference' }];
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
