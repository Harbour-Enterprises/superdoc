import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@core/Extension.js';

export const ToolbarMenu = Extension.create({
  name: 'toolbar-menu',

  addPmPlugins() {
    const icon = (text, name, attrs = {}) => {
      let button = document.createElement("div")
      let buttonInner = document.createElement("span")
      buttonInner.textContent = text
      button.appendChild(buttonInner)
      button.className = "menuicon " + name
      button.title = name
      for (let key in attrs) {
        button.setAttribute(key, attrs[key])
      }
      return button
    };

    // const setAttributes = (editorView, attrs) => {
    //   return () => {
    //     const mark = DocxSchema.marks.span.create({
    //       attributes: {...attrs}
    //     });
    //     const range = editorView.state.selection.ranges[0];
    //     const frag = editorView.state.doc.cut(range.$from.pos, range.$to.pos)
    //     const firstChild = frag.content.firstChild || null;
    //     if (!firstChild) return;

    //     const content = frag.content.firstChild.textContent;
    //     const textNode = editorView.state.schema.text(content, [mark]);

    //     editorView.dispatch(
    //       editorView.state.tr.replaceSelectionWith(textNode, false)
    //     );
    //   };
    // };
    
    const toolbarItems = [
      { command: () => { this.editor.commands.toggleBold() }, dom: icon("B", "strong") },
      { command: () => { this.editor.commands.toggleItalic() }, dom: icon("i", "em") },
      { command: () => { this.editor.commands.toggleUnderline() }, dom: icon("u", "underline") },
    ];

    const createToolbarPlugin = (items) => {
      return new Plugin({
        key: new PluginKey('toolbar-menu'),

        view(editorView) {
          const toolbar = document.createElement('div');
          toolbar.className = 'super-editor-toolbar';
          editorView.dom.parentNode.prepend(toolbar);
          items.forEach(({command, dom}) => {
            dom.style.cursor = "pointer"
            dom.addEventListener("mousedown", e => {
              e.preventDefault()

              command(editorView.state, editorView.dispatch, editorView)

              editorView.focus()
            })
            toolbar.appendChild(dom)
          })

          return {
            update(view) {
              const marks = view.state.selection.$head.marks();
              // get all buttons
              const buttons = toolbar.querySelectorAll('.menuicon');
              // remove active class from all buttons
              buttons.forEach(button => button.classList.remove('active'));
              marks.forEach(mark => {
                const name = mark.type.name;
                const button = toolbar.querySelector(`.${name}`);
                if (button) {
                  button.classList.add('active');
                }
              });
            }
          };
        }
      });
    };

    return [createToolbarPlugin(toolbarItems)];
  },
});
