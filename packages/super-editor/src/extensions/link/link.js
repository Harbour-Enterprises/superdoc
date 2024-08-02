import { Mark, Attribute } from '@core/index.js';
 
// TODO
export const Link = Mark.create({
  name: 'link',

  priority: 1000,

  keepOnSplit: false,

  addOptions() {
    return {
      htmlAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
      },
    };
  },

  parseDOM() {
    return [
      { tag: 'a' },
    ];
  },

  renderDOM({ htmlAttributes }) {
    return ['a', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      href: { 
        default: null
      },
      target: {
        default: this.options.htmlAttributes.target,
      },
      rel: {
        default: this.options.htmlAttributes.rel,
      },
      text: { 
        default: null 
      },
      attributes: {
        href: { default: null },
        rendered: false,
      },
    };
  },

  addCommands() {
    return {
      toggleLink: ({href, text}) => ({ commands }) => {
        const attrs = {
          attributes: {
            href
          },
          href,
          text,
        };
        return commands.setMark(this.name, attrs);
      },
    };
  },
});
