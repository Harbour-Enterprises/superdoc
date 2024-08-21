<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@vue-3/index.js';
import { getRichTextExtensions, Placeholder } from '@extensions/index.js';

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },

  placeholder: {
    type: String,
    required: false,
    default: 'Type something...',
  },

  options: {
    type: Object,
    required: false,
    default: () => ({}),
  },

});

const editor = shallowRef();
const editorElem = ref(null);

const onTransaction = ({ editor, transaction}) => {
  const contents = editor.getHTML();
  emit('update:modelValue', contents);
};

const onFocus = ({ editor, transaction }) => {
  emit('focus', { editor, transaction });
};

const onBlur = ({ editor, transaction }) => {
  emit('blur', { editor, transaction });
};

const initEditor = async () => {
  Placeholder.options.placeholder = props.placeholder || 'Type something...';

  props.options.onTransaction = onTransaction;
  props.options.onFocus = onFocus;
  props.options.onBlur = onBlur;
  editor.value = new Editor({
    mode: "text",
    content: document.getElementById('currentContent'),
    element: editorElem.value,
    extensions: getRichTextExtensions(),
    ...props.options,
  });
};

onMounted(() => {
  initEditor();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
});
</script>

<template>
  <div class="super-editor">
    <div id="currentContent" style="display: none;" v-html="modelValue"></div>
    <div ref="editorElem" class="editor-element"></div>
  </div>
</template>

<style scoped>
.super-editor {
  border: 1px solid #999;
  height: 100%;
  width: 100%;
}
.editor-element {
  height: 100%;
  width: 100%;
}
</style>
