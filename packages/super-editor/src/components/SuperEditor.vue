<script setup>
import DocxZipper from '@core/DocxZipper';
import { onMounted, ref } from 'vue';
import ProseMirror from '@components/ProseMirror.vue'

const emit = defineEmits(['comments-loaded']);
const props = defineProps({
  mode: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'docx'].includes(value),
  },

  documentId: {
    type: String,
    required: false,
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

const handleCommentsReady = (comments) => {
  console.debug('Comments ready', comments);
  emit('comments-loaded', comments);
}

onMounted(() => {
  init();
});
</script>

<template>
  <div v-if="isReady">
    <ProseMirror :mode="mode" :data="xmlFiles" @comments-loaded="handleCommentsReady" :documentId="documentId" />
  </div>
</template>

<style scoped>

</style>