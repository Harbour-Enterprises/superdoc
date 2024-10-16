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
    /* commented out to allow paragraph to grow with content */

    // maxHeight: props.styleOverride.coordinates?.minHeight,
    // maxWidth: props.styleOverride.coordinates?.minWidth,
  }
});

</script>

<template>
  <div class="paragraph-field" :style="getStyle" v-if="field.value" v-html="field.value"></div>
  <span v-else>{{ field.placeholder || field.label }}</span>
</template>

<style scoped>
  .paragraph-field {
    margin: 0;
    padding: 1px;
  }
</style>
