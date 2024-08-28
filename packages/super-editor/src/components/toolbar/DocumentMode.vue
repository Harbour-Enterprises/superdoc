<script setup>
const emit = defineEmits(['select'])
const props = defineProps({
  options: {
    type: Array,
  },
});

const handleClick = (item) => {
  emit('select', item);
}
</script>

<template>
  <div class="document-mode">

    <div
        class="option-item"
        v-for="option in options"
        @click="handleClick(option)"
        :class="{ disabled: option.disabled }">
      <div class="document-mode-column icon-column">
        <div>
          <i :class="option.icon"></i>
        </div>
      </div>

      <div class="document-mode-column text-column">
        <div class="document-mode-type">
          {{ option.label }}
        </div>
        <div class="document-mode-description">
          {{ option.description }}
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
}
.document-mode {
  display: flex;
  flex-direction: column;
  padding: 10px;
}
.option-item {
  display: flex;
  flex-direction: row;
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}
.document-mode-column {
  display: flex;
  flex-direction: column;
}
.document-mode-type {
  font-weight: 400;
  font-size: 15px;
  color: #222;
}
.icon-column {
  margin-right: 5px;
  justify-content: flex-start;
  align-items: center;
  padding: 0 5px;
  font-size: 18px;
  color: black;
  height: 100%;
}
.document-mode-description {
  font-size: 12px;
  color: #666;
}
.option-item:hover {
  background-color: #C8D0D8;
}
</style>