<script setup>
const emit = defineEmits(['select'])
</script>

<template>
  <div class="alignment-buttons">

    <div class="button-icon" @click="emit('select', 'left')"><i class="fas fa-align-left"></i></div>
    <div class="button-icon" @click="emit('select', 'center')"><i class="fas fa-align-center"></i></div>
    <div class="button-icon" @click="emit('select', 'right')"><i class="fas fa-align-right"></i></div>
    <div class="button-icon" @click="emit('select', 'justify')"><i class="fas fa-align-justify"></i></div>

  </div>
</template>

<style scoped>
.alignment-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px;
}
.button-icon {
  cursor: pointer;
  padding: 12px;
  font-size: 16px;
  width: 25px;
  height: 25px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.button-icon:hover {
  background-color: #d8dee5;
}
</style>