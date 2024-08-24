import { Node, Attribute } from '@core/index.js';

export const Image = Node.create({

  name: 'image',

  draggable: true,

  group: 'inline',

  inline: true,

  addOptions() {
    return {
      allowBase64: true,
      htmlAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: { default: null, },
      alt: { default: null, },
      title: { default: null, },
      size: {
        renderDOM: ({ size }) => {
          let style = '';
          const { width, height } = size;
          if (width) style += `width: ${width}px;`;
          if (height) style += `height: ${height}px;`;
          return { style };
        }
      }
    }
  },

  parseDOM() {
    return [
      {
        tag: this.options.allowBase64
          ? 'img[src]'
          : 'img[src]:not([src^="data:"])',
      },
    ]
  },

  renderDOM({ htmlAttributes }) {
    return ['img', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes)]
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => {
          const [,, alt, src, title] = match
          return { src, alt, title }
        },
      }),
    ]
  },

});