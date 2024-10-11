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

.insertionMark {
    &.inline {
      &.hidden {
        display: none;
      }
      &.normal {
      }
      &.highlighted {
        border: 1px dashed #00853D;
        background-color: #399C7222;
        pointer-events: none;
      }
    }
}

.deletionMark {
    &.inline {
      &.hidden {
        display: none;
      }
      &.normal {
      }
    }
    &.widget {
        border: 1px dashed #CB0E47;
        background-color: #CB0E4722;
        pointer-events: none;
    }
}

/* Protect against generic img rules */
img.ProseMirror-separator {
  display: inline !important;
  border: none !important;
  margin: 0 !important;
}
  
.ProseMirror li[data-marker-type] {
  list-style-type: none;
}

.ProseMirror li[data-marker-type]::marker {
  content: attr(data-marker-type) ' ';
}
`;
