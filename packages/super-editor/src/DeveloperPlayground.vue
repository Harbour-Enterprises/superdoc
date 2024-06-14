<!-- 
  Dev app for the SuperEditor component

  The super-editor package exports SuperEditor directly. Thus, this app simulates the process
  of importing the component into another Vue 3 app (ie: superdoc) and using it.
-->

<script setup>
import { nextTick, ref } from 'vue';
import BasicUpload from './dev-components/BasicUpload.vue';

// Import the component the same you would in your app
import { SuperEditor } from '@/index';

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
      <div class="title">
        <h2>Super Editor Dev Area</h2>
      </div>

      <!--
          A user using SuperEditor is expected to handle file uplodas and data sources on their own.
          SuperEditor just expects a URL to a docx file. This basic uploader is here for testing.
          You can also replace currentFile directly with a URL (ie: sampleDocxUrl).
      -->
      <div>
        Upload docx
        <BasicUpload @file-change="handleNewFile" />
      </div>
    </div>
    <div class="content" v-if="currentFile">

      <!-- SuperEditor expects its data to be a URL -->
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
  flex-direction: column;
  background-color: rgb(222, 237, 243);
  padding: 20px;
  margin-bottom: 20px;
}
.content {
  display: flex;
  justify-content: center;
}
</style>
