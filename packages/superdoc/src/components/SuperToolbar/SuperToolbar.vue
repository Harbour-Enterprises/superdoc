<script setup>
import 'super-editor/style.css';
import { getCurrentInstance, ref, onMounted } from 'vue';
import { Toolbar } from 'super-editor';
import { watch } from 'vue';

const { proxy } = getCurrentInstance();
const toolbar = ref(null);

const handleToolbarCommand = (command) => {
  console.debug('[SuperToolbar] Toolbar command', command);
  proxy.$superdoc.onToolbarCommand(command);
}

</script>

<template>
  <div ref="toolbar">
    <Toolbar class="toolbar" :editorInstance="$superdoc.activeEditor" @command="handleToolbarCommand" />
  </div>
</template>

<style scoped>
</style>