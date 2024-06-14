<script setup>
import DocxZipper from '@classes/docx-zipper';
import { onMounted, ref } from 'vue';
import ProseMirror from '@components/docx-editor/ProseMirror.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'text'
  },

  dataUrl: {
    type: String,
    required: false,
  }
});

const isReady = ref(false);
const xmlFiles = ref([]);

const getXmlData = async (url) => {
  const file = await getDocxFromUrl(url);

  const zipper = new DocxZipper();
  xmlFiles.value = await zipper.getXmlData(file);
}

const getDocxFromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

const init = async () => {
  if (props.dataUrl) await getXmlData(props.dataUrl);
  isReady.value = true;
}

onMounted(() => {
  init();
});
</script>

<template>
  <div v-if="isReady">
    <ProseMirror :mode="mode" :data="xmlFiles" />
  </div>
</template>

<style scoped>

</style>