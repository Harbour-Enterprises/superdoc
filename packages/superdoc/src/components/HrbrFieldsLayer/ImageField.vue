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
})
</script>

<template>
  <div class="image-field" :style="getStyle">
    <img v-if="field.value" :src="field.value" alt="image" :style="getStyle" />
    <span v-else>{{ field.placeholder || field.label }}</span>
  </div> 
</template>

<style scoped>
.image-field {
  overflow: hidden;
  display: flex;
  align-items: center;
  margin-top: 2px;
}
img {
  max-height: 100%;
}
</style>
