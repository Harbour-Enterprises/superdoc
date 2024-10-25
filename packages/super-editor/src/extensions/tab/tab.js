import { Node, Attribute } from '@core/index.js';

export const TabNode = Node.create({
  name: 'tab',
  group: 'inline',
  inline: true,
  // need this prop so Prosemirror doesn't insert 
  content: 'inline*',
  selectable: false,
  atom: true,
  
  addOptions() {
    return {
      htmlAttributes: {
        class: 'tab',
        contentEditable: false
      },
    };
  },

  parseDOM() {
    return [{tag: 'span.tab'}];
  },

  renderDOM({ htmlAttributes }) {
    return ['span', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      tabSize: {
        renderDOM: ({ tabSize }) => {
          if (!tabSize) return {};
          const style = `width: ${tabSize}px;`;
          return { style };
        },
      },
    };
  },

});
