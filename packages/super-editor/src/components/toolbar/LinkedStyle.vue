<script setup>
import { computed } from 'vue';
import { toolbarIcons } from './toolbarIcons.js';

const emit = defineEmits(['select']);
const props = defineProps({
  editor: {
    type: Object,
    required: true,
  },
});

const select = (alignment) => {
  emit('select', alignment);
};

const getStylesList = computed(() => {
  return editor.converter.linkedStyles.filter((style) => {
    return style.style.qFormat;
  });
});
</script>

<template>
  <div class="linked-style-buttons">
    <div v-for="definition in getStylesList">
      {{ definition.style.name }}
    </div>
    <!-- <div class="button-icon" @click="select('left')">test</div> -->
    <!-- <div class="button-icon" @click="select('center')" v-html="toolbarIcons.alignCenter"></div>
    <div class="button-icon" @click="select('right')" v-html="toolbarIcons.alignRight"></div>
    <div class="button-icon" @click="select('justify')" v-html="toolbarIcons.alignJustify"></div> -->
  </div>
</template>

<style scoped>
.linked-style-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
.button-icon {
  cursor: pointer;
  padding: 5px;
  font-size: 16px;
  width: 25px;
  height: 25px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}
.button-icon:hover {
  background-color: #d8dee5;
}

.button-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  fill: currentColor;
}
</style>
