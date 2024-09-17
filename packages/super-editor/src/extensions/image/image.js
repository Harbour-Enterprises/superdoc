import { Node, Attribute } from '@core/index.js';

export const Image = Node.create({

  name: 'image',

  draggable: true,

  group: 'inline',

  inline: true,

  addOptions() {
    return {
      allowBase64: false,
      htmlAttributes: {},
    }
  },

  addStorage() {
    return {
      media: {},
    }
  },

  addAttributes() {
    return {
      src: {
        renderDOM: ({ src }) => {
          return { src: this.storage.media[src] };
        }
      },
      alt: { default: null, },
      title: { default: null, },
      size: {
        renderDOM: ({ size }) => {
          let style = 'display: "inline-block";';
          const { width, height } = size;
          if (width) style += `width: ${width}px;`;
          if (height) style += `height: auto;`;
          return { style };
        }
      },
      marginOffset: {
        renderDOM: ({ marginOffset }) => {
          const { left = 0, top = 0 } = marginOffset;

          let style = '';
          if (left) style += `margin-left: ${left}px;`;
          if (top) style += `margin-top: ${top}px;`;
          return { style };
        },
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