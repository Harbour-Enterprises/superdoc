<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  isEditing: {
    type: Boolean,
    required: false,
    default: false,
  },
  styleOverride: {
    type: Object,
    required: false,
    default: () => ({}),
  },
});

const getStyle = computed(() => {
  return {
    maxHeight: props.styleOverride.coordinates?.minHeight,
    maxWidth: props.styleOverride.coordinates?.minWidth,
  }
});

</script>

<template>
  <div class="paragraph-field" :style="getStyle" v-html="field.value"></div>
</template>

<style scoped>
  .paragraph-field {
    margin: 0;
    padding: 1px;
  }
</style>
