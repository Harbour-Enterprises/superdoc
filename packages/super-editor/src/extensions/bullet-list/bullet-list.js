import { Node } from '@core/index.js';
import { Attribute } from '@core/index.js';

export const BulletList = Node.create({
  name: 'bulletList',

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`;
  },

  addOptions() {
    return {
      itemTypeName: 'listItem',
      htmlAttributes: {},
      keepMarks: true,
    };
  },

  parseDOM() {
    return [{ tag: 'ul' }];
  },

  renderDOM({ htmlAttributes }) {
    const attributes = Attribute.mergeAttributes(
      this.options.htmlAttributes, 
      htmlAttributes,
    );
    return ['ul', attributes, 0];
  },

  addAttributes() {
    return {
      'list-style-type': {
        default: 'bullet',
        rendered: false,
      },

      attributes: {
        rendered: false,
      },
    };
  },

  addCommands() {
    return {
      toggleBulletList: () => (props) => {      
        const { commands, chain } = props;
        return commands.toggleList(
          this.name, 
          this.options.itemTypeName, 
          this.options.keepMarks,
        );
      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Shift-8': () => {
        return this.editor.commands.toggleBulletList();
      },
    };
  },

  // Input rules.
});
