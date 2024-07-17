<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"

const editor = ref(null);

const jsonData = {
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "run",
            "content": [
              {
                "type": "text",
                "text": "I AM DOCX",
              }
            ]
          },

        ]
      }
    ]
  }
}
const emit = defineEmits(['content-change']);

const noteSchema = new Schema({
  nodes: {
    text: {},
    run: {
      content: "text*",
      toDOM() { return ["run", 0] },
      parseDOM: [{tag: "run"}]
    },
    runcontainer: {
      content: "run | rungroup",
      toDOM() { return ["runcontainer", 0] },
      parseDOM: [{tag: "runcontainer"}]
    },
    rungroup: {
      content: "runcontainer+",
      toDOM() { return ["rungroup", 0] },
      parseDOM: [{tag: "rungroup"}]
    },
    paragraph: {
      content: "run*",
      toDOM() { return ["paragraph", 0] },
      parseDOM: [{tag: "paragraph"}]
    },
    doc: {
      content: "paragraph+"
    }
  }
});


const initEditor = () => {
  const editorContainer = editor.value;
  const state = EditorState.create({
    doc: noteSchema.nodeFromJSON(jsonData.doc),
  });

  let view = new EditorView(editorContainer, {
    state,
    dispatchTransaction(transaction) {
      // console.log("Document size went from", transaction.before.content.size,
      //             "to", transaction.doc.content.size)
      let newState = view.state.apply(transaction);
      emit('content-change', newState.toJSON());
      view.updateState(newState);

      console.debug('transaction', transaction)
    }
  });

  emit('content-change', state.toJSON());
};

onMounted(() => {
  initEditor();
});
</script>

<template>
  <div class="editor-container">
    <div ref="editor" class="editor"></div>
  </div>
</template>

<style scoped>
.editor-container {
  width: 100%;
  min-height: 800px;
  border: 1px solid #DFDFDF;
  margin-bottom: var(--page-spacing);
  padding: 50px;
}
</style>