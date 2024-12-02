// https://github.com/ProseMirror/prosemirror-view/blob/master/style/prosemirror.css
// https://github.com/ueberdosis/tiptap/blob/main/packages/core/src/style.ts

/**
 * Basic ProseMirror styles.
 */
export const style = `.ProseMirror {
  position: relative;
}

.ProseMirror {
  word-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
  -webkit-font-variant-ligatures: none;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0; /* the above doesn't seem to work in Edge */
}

.ProseMirror pre {
  white-space: pre-wrap;
}

.ProseMirror li {
  position: relative;
}

/* 
  Hide marker for indented lists. 
  If a list-item contains a list but doesn't contain a "p" tag with text.
*/
.ProseMirror li:has(> ul:first-child, > ol:first-child):not(:has(> p)) {
  list-style-type: none;
}
.ProseMirror li:has(> ul:first-child, > ol:first-child):not(:has(> p))::marker {
  content: '';
}

.ProseMirror li::marker {
  font-size: var(--marker-font-size);
  font-family: var(--marker-font-family);
}

.ProseMirror li[data-marker-type] {
  list-style-type: none;
}

.ProseMirror li[data-marker-type]::marker {
  content: attr(data-marker-type) ' ';
}

.ProseMirror-hideselection *::selection {
  background: transparent;
}

.ProseMirror-hideselection *::-moz-selection {
  background: transparent;
}

.ProseMirror-hideselection * {
  caret-color: transparent;
}

/* See https://github.com/ProseMirror/prosemirror/issues/1421#issuecomment-1759320191 */
.ProseMirror [draggable][contenteditable=false] { 
  user-select: text 
}

.ProseMirror-selectednode {
  outline: 2px solid #8cf;
}

/* Make sure li selections wrap around markers */
li.ProseMirror-selectednode {
  outline: none;
}

li.ProseMirror-selectednode:after {
  content: "";
  position: absolute;
  left: -32px;
  right: -2px; top: -2px; bottom: -2px;
  border: 2px solid #8cf;
  pointer-events: none;
}

/* Protect against generic img rules */
img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
}

.ProseMirror .tab {
  display: inline-block;
  vertical-align: text-bottom;
}
.ProseMirror u .tab {
  white-space: pre;
  border-bottom: 1px solid #000;
  margin-bottom: 1.5px;
}

/* Track changes */
.ProseMirror .track-insert-dec,
.ProseMirror .track-delete-dec,
.ProseMirror .track-format-dec {
  pointer-events: none;
}

.ProseMirror .track-insert-dec.hidden,
.ProseMirror .track-delete-dec.hidden {
  display: none;
}

.ProseMirror .track-insert-dec.highlighted {
  border-top: 1px dashed #00853D;
  border-bottom: 1px dashed #00853D;
  background-color: #399C7222;
}

.ProseMirror .track-delete-dec.highlighted {
  border-top: 1px dashed #CB0E47;
  border-bottom: 1px dashed #CB0E47;
  background-color: #CB0E4722;
  text-decoration: line-through;
  text-decoration-thickness: 2px;
}

.ProseMirror .track-format-dec.highlighted {
  border-bottom: 2px solid gold;
}

.ProseMirror .track-delete-widget {
  visibility: hidden;
}

/* Collaboration cursors */
.ProseMirror > .ProseMirror-yjs-cursor:first-child {
  margin-top: 16px;
}
.ProseMirror-yjs-cursor {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid black;
  border-right: 1px solid black;
  border-color: orange;
  word-break: normal;
  pointer-events: none;
}
.ProseMirror-yjs-cursor > div {
  position: absolute;
  top: -1.05em;
  left: -1px;
  font-size: 13px;
  background-color: rgb(250, 129, 0);
  font-family: serif;
  font-style: normal;
  font-weight: normal;
  line-height: normal;
  user-select: none;
  color: white;
  padding-left: 2px;
  padding-right: 2px;
  white-space: nowrap;
}

/* Image placeholder */
.ProseMirror placeholder {
  display: inline;
  border: 1px solid #ccc;
  color: #ccc;
}

.ProseMirror placeholder:after {
  content: "☁";
  font-size: 200%;
  line-height: 0.1;
  font-weight: bold;
}
`;
