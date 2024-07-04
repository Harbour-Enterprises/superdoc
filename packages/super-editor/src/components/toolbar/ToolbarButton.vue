<script setup>

const emit = defineEmits(['command']);
const props = defineProps({
  command: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const handleClick = () => emit('command', props.command);
</script>

<template>
  <div
      class="toolbar-button"
      :class="{ active: props.active }"
      @click.stop.prevent="handleClick">
        <slot></slot>
  </div>
</template>

<style scoped>
.toolbar-button {
  height: 32px;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: 6px;
  margin-top: 3.5px;
  margin-bottom: 4px;
  text-overflow: ellipsis;
  overflow-y: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #47484a;
  transition: all 0.2s ease-out;
  user-select: none;
  overflow: hidden;
}
.toolbar-button:hover {
  color: black;
  background-color: #d8dee5;
}
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}
</style>