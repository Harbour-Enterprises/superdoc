<script setup>
import { nextTick, ref } from 'vue';
import BasicUpload from './dev-components/BasicUpload.vue';
import SuperEditor from './components/SuperEditor.vue';

// For testing a file from URL
import sampleDocxUrl from './tests/fixtures/sample/sample.docx?url';

const currentFile = ref(null);
const handleNewFile = (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  nextTick(() => {
    currentFile.value = fileUrl;
  });
}

</script>

<template>
  <div class="dev-app">
    <div class="header">
      <div>
        Upload docx
        <BasicUpload @file-change="handleNewFile" />
      </div>
    </div>
    <div class="content" v-if="currentFile">
      <SuperEditor mode="docx" :data-url="currentFile" />
    </div>
  </div>
</template>

<style scoped>
.dev-app {
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  background-color: rgb(222, 237, 243);
  padding: 20px;
  margin-bottom: 20px;
}
.content {
  display: flex;
  justify-content: center;
}
</style>
