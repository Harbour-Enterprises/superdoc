<script setup>
import 'super-editor/style.css';
import { getCurrentInstance, ref, onMounted } from 'vue';
import { Toolbar } from 'super-editor';

const { proxy } = getCurrentInstance();
const toolbar = ref(null);

const handleToolbarCommand = (command) => {
  console.debug('[SuperToolbar] Toolbar command', command);
  proxy.$superdoc.onToolbarCommand(command);
}

onMounted(() => {
  // This sets $superdoc.toolbar to the Toolbar component from super-editor
  proxy.$superdoc.setToolbar(toolbar.value);
})
</script>

<template>
  <div>
    <Toolbar class="toolbar" @command="handleToolbarCommand" ref="toolbar"/>
  </div>
</template>

<style scoped>
</style>