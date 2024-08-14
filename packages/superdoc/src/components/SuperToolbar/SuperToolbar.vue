<script setup>
import 'super-editor/style.css';
import { getCurrentInstance, ref, onMounted } from 'vue';
import { Toolbar } from 'super-editor';

const { proxy } = getCurrentInstance();
const toolbar = ref(null);
const innerToolbar = ref(null);

const handleToolbarCommand = ({ item, argument }) => {
  proxy.$superdoc.onToolbarCommand({ item, argument });
}

const onTextSelectionChange = (marks, selectionText = null, coords = null) => {
  console.log("Text selection change", marks, selectionText)
  // const mark = marks.find(mark => mark.type.name === 'link') || null;
  // handleSelectionChange({mark, coords});
  // emit('select', {mark, coords})
}

defineExpose({
  innerToolbar
});
</script>

<template>
  <div ref="toolbar">
    <Toolbar class="toolbar" @command="handleToolbarCommand" ref="innerToolbar" />

  </div>
</template>

<style scoped>
</style>