import { Mark, Attribute } from '@core/index.js';
 
export const Link = Mark.create({
  name: 'link',

  priority: 1000,

  keepOnSplit: false,

  inclusive: false,

  addOptions() {
    return {
      protocols: ['http', 'https'],
      htmlAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
      },
    };
  },

  parseDOM() {
    return [{ tag: 'a' }];
  },

  renderDOM({ htmlAttributes }) {
    if (!isAllowedUri(htmlAttributes.href, this.options.protocols)) {
      return ['a', mergeAttributes(this.options.htmlAttributes, { ...htmlAttributes, href: '' }), 0]
    }

    return ['a', Attribute.mergeAttributes(this.options.htmlAttributes, htmlAttributes), 0];
  },

  addAttributes() {
    return {
      href: { 
        default: null,
        renderDOM: ({ href, name }) => {
          if (href && isAllowedUri(href, this.options.protocols)) return { href };
          else if (name) return { href: `#${name}` };
          return {};
        },
      },
      target: {
        default: this.options.htmlAttributes.target,
      },
      rel: {
        default: this.options.htmlAttributes.rel,
      },
      rId: {
        default: this.options.htmlAttributes.rId || null,
      },
      text: { 
        default: null 
      },
      name: {
        default: null,
      }
    };
  },

  addCommands() {
    return {
      setLink: ({ href }) => ({ chain }) => {
        return chain().setMark(this.name, { href }).run();
      },
      unsetLink: () => ({ chain }) => {
        return chain()
              .unsetMark('underline')
              .unsetColor()
              .unsetMark(this.name, { extendEmptyMarkRange: true })
              .run();
      },
      toggleLink: ({ href }) => ({ commands }) => {
        if (!href) return commands.unsetLink();
        return commands.setLink({ href });
      },
    };
  },
});

const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
function isAllowedUri(uri, protocols) {
  const allowedProtocols = ['http', 'https', 'mailto']

  if (protocols) {
    protocols.forEach(protocol => {
      const nextProtocol = (typeof protocol === 'string' ? protocol : protocol.scheme)

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  // eslint-disable-next-line no-useless-escape
  return !uri || uri.replace(ATTR_WHITESPACE, '').match(new RegExp(`^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))`, 'i'))
}
