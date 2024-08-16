<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
});

const getBarColor = computed(() => {
  if (props.name === 'color') return { backgroundColor: props.color || '#111111' };
});

</script>

<template>
  <div class="toolbar-icon">
    <font-awesome-icon :icon="icon" v-if="props.name !== 'color'"/>
    <font-awesome-icon :icon="icon" size="xs" v-else class="font-icon" />
    
    <div class="color-bar" v-if="props.name === 'color'" :style="getBarColor"></div>
  </div>
</template>

<style scoped>
.toolbar-icon {
  display: flex;
  align-items: center;
}
.toolbar-button-icon {
  max-height: 100%;
}
.toolbar-button:hover {
  color: black;
  background-color: #d8dee5;
}
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}

.color-bar {
  border-radius: 4px;
  position: absolute;
  z-index: 5;
  height: 4px;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  width: 16px;
}
.font-icon {
  margin-top: -3px;
}
</style>