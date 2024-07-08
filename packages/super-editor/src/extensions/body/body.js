import { Node } from '@core/index.js';

export const Body = Node.create({
  name: 'body',

  content: '(paragraph+ | bulletList* | orderedList*)',

  renderDOM() {
    return ['body', 0];
  },

  addAttributes() {
    return {
      attributes: {
        rendered: false,
      },
    };
  },

});
