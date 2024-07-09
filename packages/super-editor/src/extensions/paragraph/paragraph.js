import { Node } from '@core/index.js';

export const Paragraph = Node.create({
  name: 'paragraph',

  group: 'block',

  // If possible, we should force at least one run inside a paragraph
  // Will need special handling for 'enter' etc.
  content: 'run+',

  inline: false,

  parseDOM() {
    return [{ tag: 'p' }];
  },

  renderDOM() {
    return ['p', 0];
  },

  addAttributes() {
    return {
      attributes: {
        rendered: false,
      },
    };
  },
});
