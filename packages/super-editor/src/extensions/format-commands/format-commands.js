import { Extension } from '@core/index.js';

export const FormatCommands = Extension.create({
  name: 'formatCommands',

  addOptions() {
    return {};
  },

  addCommands() {
    return {
      clearFormat: () => ({ chain }) => {
        return chain()
          .clearNodes()
          .unsetAllMarks()
          .run();
      },

      clearMarksFormat: () => ({ chain }) => {
        return chain()
          .unsetAllMarks()
          .run();
      },

      clearNodesFormat: () => ({ chain }) => {
        return chain()
          .clearNodes()
          .run();
      },

      getActiveFormatting: () => ({ chain }) => {
        const marks = this.editor.commands.getActiveMarks();
        const parsedMarks = marks.map((mark) => {
          const { attrs, type } = mark;
          const { name } = type;
          return {
            name,
            attrs,
          }
        });
      
        const ignoreKeys = ['paragraphSpacing']
        const attributes = this.editor.commands.getActiveAttributes();
        Object.keys(attributes).forEach((key) => {
          if (ignoreKeys.includes(key)) return;
          const attrs = {};
          attrs[key] = attributes[key];
          parsedMarks.push({ name: key, attrs })
        })
        return parsedMarks;
      },

      getActiveMarks: () => ({ chain }) => {
        const state = this.editor.state;
        const { from, to } = state.selection;
        let marks = [];
        
        if (from === to) {
          marks = state.storedMarks || state.selection.$from.marks();
        } else {
          state.doc.nodesBetween(from, to, node => {
            marks = marks.concat(node.marks);
          });
        }
      
        return marks;
      },
    
      getActiveAttributes: () => ({ chain }) => {
        const state = this.editor.state;
        const { from, to, empty } = state.selection;
      
        const attributes = {};
        const getAttrs = (node) => {
          Object.keys(node.attrs).forEach(key => {
            const value = node.attrs[key];
            if (value) {
              attributes[key] = value;
            }
          });
        }
      
        let start = from;
        let end = to;
        if (empty) state.doc.nodesBetween(start, end + 1, (node) => getAttrs(node))
        else state.doc.nodesBetween(from, to, (node) => getAttrs(node));
        return attributes;
      },

      copyFormat: () => ({ chain }) => {

        // If we have a saved style, apply it
        if (this.editor.storedStyle) {
          const storedMarks = this.editor.storedStyle;
          if (!storedMarks.length) {
            this.editor.storedStyle = null;
            return chain().clearFormat().run();
          }

          const processedMarks = [];
          storedMarks.forEach(mark => {
            const { type, attrs } = mark;
            const { name } = type;

            if (name === 'textStyle') {
              Object.keys(attrs).forEach(key => {
                if (!attrs[key]) return;
                const attributes = {};
                attributes[key] = attrs[key];
                processedMarks.push({ name: key, attrs: attributes });
              });
            } else {
              processedMarks.push({ name, attrs });
            }
          });

          const marksToCommands = {
            bold: ['setBold', 'unsetBold'],
            italic: ['setItalic', 'unsetItalic'],
            underline: ['setUnderline', 'unsetUnderline'],
            color: ['setColor', 'unsetColor'],
            fontSize: ['setFontSize', 'setFontSize', '12pt'],
            fontFamily: ['setFontFamily', 'unsetFontFamily'],
          }

          Object.keys(marksToCommands).forEach((key) => {
            const [setCommand, unsetCommand, defaultParam] = marksToCommands[key];
            const hasMark = processedMarks.find(mark => mark.name === key);
            if (!hasMark) return chain()[unsetCommand](defaultParam).run();
            chain()[setCommand](hasMark.attrs[key]).run();
          });

          this.editor.storedStyle = null;
          return true;
        }

        // If we don't have a saved style, save the current one
        const marks = this.editor.commands.getActiveMarks();
        this.editor.storedStyle = marks;

      },
    };
  },

  addShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.clearFormat(),
    };
  },
});
