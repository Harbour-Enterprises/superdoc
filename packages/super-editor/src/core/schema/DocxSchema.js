import { Schema } from "prosemirror-model"

const olDOM = ["ol", 0], ulDOM = ["ul", 0], liDOM = ["li", 0];

/**
 * Custom schema for docx files with prose mirror
 * Reference: https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts
 */
const DocxSchema = new Schema({
  nodes: {
  
    bulletList: {
      content: "listItem+",
      group: "block list",
      parseDOM: [{ tag: "ul" }],
      toDOM() { return ulDOM; },
    },

    orderedList: {
      content: "listItem+",
      group: "block list",
      parseDOM: [{tag: "ol", getAttrs(dom) {
        return {order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1};
      }}],
      toDOM(node) {
        return node.attrs.order === 1 ? olDOM : ["ol", {start: node.attrs.order}, 0];
      },
      attrs: {order: {default: 1}},
    },
    
    listItem: {
      content: "paragraph block*",
      parseDOM: [{tag: "li"}],
      toDOM() { return liDOM },
      defining: true,
    },

    commentRangeStart: {
      content: "text*",
      inline: true,
      group: "inline",
      toDOM() { return ["commentRangeStart", 0]; },
      parseDOM: [{ tag: "commentRangeStart" }],
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },

    commentRangeEnd: {
      content: "text*",
      inline: true,
      group: "inline",
      toDOM() { return ["commentRangeEnd", 0]; },
      parseDOM: [{ tag: "commentRangeEnd" }],
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },

    commentReference: {
      content: "text*",
      inline: true,
      group: "inline",
      toDOM() { return ["commentReference", 0]; },
      parseDOM: [{ tag: "commentReference" }],
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },
    

    text: {
      inline: true,
      group: "inline",
    },
  
    run: {
      content: "text*",
      toDOM() { return ["run", 0]; },
      parseDOM: [{ tag: "run" }],
      inline: true,
      group: "inline",
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },
  
    paragraph: {
      content: "inline*",
      inline: false,
      group: "block",
      toDOM() { return ["p", 0]; },
      parseDOM: [{ tag: "p" }],
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },
  
    body: {
      content: "(paragraph+ | bulletList* | orderedList*)",
      toDOM() { return ["body", 0]; },
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },
  
    doc: {
      content: "body",
      toDOM() { return ["doc", 0]; },
      parseDOM: [{ tag: "doc" }],
      attrs: {
        attributes: { default: {} },
        type: { default: null },
      },
    },
  
  },
  marks: {
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b", getAttrs: (node) => node.style.fontWeight != "normal" && null },
        { style: "font-weight=400", clearMark: m => m.type.name == "strong" },
        { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null },
      ],
      toDOM() { return ["strong", 0]; }
    },
    em: {
      parseDOM: [
        { tag: "i" }, { tag: "em" },
        { style: "font-style=italic" },
        { style: "font-style=normal", clearMark: m => m.type.name == "em" }
      ],
      toDOM() { return ["em", 0]; }
    }
  }
});

export {
  DocxSchema
}