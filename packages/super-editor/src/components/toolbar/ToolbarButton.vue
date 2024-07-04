<script setup>

const emit = defineEmits(['command']);
const props = defineProps({
  command: {
    type: String,
    required: true,
  },
});

const handleClick = () => emit('command', props.command);
</script>

<template>
  <div class="toolbar-button" @click.stop.prevent="handleClick">
    <slot></slot>
  </div>
</template>

<style scoped>
</style>