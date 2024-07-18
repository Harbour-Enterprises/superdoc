import { Node } from '@core/index.js';

export const Body = Node.create({
  name: 'body',

  content: '(paragraph+ | bulletedList* | orderedList*)',

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
