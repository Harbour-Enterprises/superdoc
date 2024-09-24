<script setup>

const emit = defineEmits(['command']);
const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="toolbar-separator">
    <div class="separator-inner"></div>
  </div>
</template>

<style scoped>
.toolbar-separator {
  height: 32px;
  border-radius: 6px;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DBDBDB;
  transition: all 0.2s ease-out;
  user-select: none;
  overflow: hidden;
}
.toolbar-separator .separator-inner {
  width: 1.5px;
  height: 20px;
  background-color: #DBDBDB;
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
