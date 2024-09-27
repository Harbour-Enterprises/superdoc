<script setup>
import {computed} from 'vue';
import {storeToRefs} from 'pinia';
import {useHrbrFieldsStore} from '@/stores/hrbr-fields-store';
import {useSuperdocStore} from '@/stores/superdoc-store';

const superdocStore = useSuperdocStore();
const hrbrFieldsStore = useHrbrFieldsStore();
const {getAnnotations} = storeToRefs(hrbrFieldsStore);
const {getAttachments} = storeToRefs(superdocStore);

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
  optionId: {
    type: String,
    required: true,
  },
});

const getStyle = computed(() => {
  return {
    maxHeight: props.styleOverride.coordinates?.minHeight,
    maxWidth: props.styleOverride.coordinates?.minWidth,
  }
});

const multipleInputAnnotations = computed(() => {
  return getAnnotations.value.filter(a => a.fieldId === props.field.id);
});

const imageValue = computed(() => {
  if (typeof props.field.value === 'string') return props.field.value;

  const annotationIndex = multipleInputAnnotations.value.findIndex(annotation => annotation.originalAnnotationId === props.optionId);
  const attachment = getAttachments.value.find(a => a.id === props.field.value[annotationIndex]?.referenceattachmentid || a.id === props.field.value[annotationIndex]?.userattachmentid);
  return attachment?.base64data || '';
});

</script>

<template>
  <div class="image-field" :style="getStyle">
    <img v-if="field.value" :src="imageValue" alt="image" :style="getStyle" />
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
