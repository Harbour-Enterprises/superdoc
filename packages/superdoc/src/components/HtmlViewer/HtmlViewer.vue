<script setup>
import { defineProps, onMounted, ref } from 'vue';
const props = defineProps({
    fileSource: {
        type: File,
        required: true,
    },
    documentId: {
        type: String,
        required: true,
    },
});

const documentContent = ref('');

const loadDocument = (file) => {
    // open file
    console.log('loading file', file);

    // read file
    const reader = new FileReader();
    reader.onload = (e) => {
        documentContent.value = e.target.result;
    }
    reader.readAsText(file);
}

onMounted(() => {
    loadDocument(props.fileSource);
});

</script>

<template>
    <div class="super-editor" v-html="documentContent"></div>
</template>
