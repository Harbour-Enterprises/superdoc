import { Node, Attribute } from '@core/index.js';

export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  inline: false,

  // parseDOM() {
  //   return [{ tag: 'p' }];
  // },

  addAttributes() {
    return {
      'w:type': {
        renderDOM: (attrs) => {
          return {
            'type': 'page'
          };
        },
      },
      attributes: {
        rendered: false,
      },
    };
  },

  renderDOM({ htmlAttributes }) {
    // type can be 'page' - for a hard break
    // TODO: Figure out how to use this when we have pagination
    const { type } = htmlAttributes;
    const style = "margin-top: 100px;";
    return ['p', { style }, 0];
  },
});
