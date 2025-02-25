import { Node, Attribute } from '@core/index.js';
import { v4 as uuidv4 } from 'uuid';

export const CommentRangeStart = Node.create({
  name: 'commentRangeStart',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: false,

  draggable: false,

  parseDOM() {
    return [{ tag: 'commentRangeStart' }];
  },

  addOptions() {
    return {
      htmlAttributes: {
        contentEditable: 'false',
      }
    }
  },

  renderDOM({ htmlAttributes}) {
    return ['commentRangeStart', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes)];
  },

  addAttributes() {
    return {
      'w:id': {
        rendered: false,
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

  inline: true,

  atom: true,

  selectable: false,

  draggable: false,

  addOptions() {
    return {
      htmlAttributes: {
        contentEditable: 'false',
      }
    }
  },

  parseDOM() {
    return [{ tag: 'commentRangeEnd' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['commentRangeEnd', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes)];
  },

  addAttributes() {
    return {
      'w:id': {
        rendered: false,
      },
    };
  },
});

export const CommentReference = Node.create({
  name: 'commentReference',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: false,

  draggable: false,

  addOptions() {
    return {
      htmlAttributes: {
        contentEditable: 'false',
      }
    }
  },

  parseDOM() {
    return [{ tag: 'commentReference' }];
  },

  renderDOM({ htmlAttributes }) {
    return ['commentReference', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes)];
  },

  addAttributes() {
    return {
      attributes: {
        rendered: false,
      },
    };
  },
});
