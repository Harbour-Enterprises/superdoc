<script setup>
import { onMounted, computed } from "vue";

const emit = defineEmits(["select", "clickoutside"]);
const props = defineProps({
  icons: {
    type: Array,
    required: true,
  },
  activeColor: {
    type: Object,
    required: false,
  }
});

const handleClick = (option) => {
  emit('select', option.value);
}

const isActive = computed(() => (option) => {
  if (!props.activeColor.value) return false;
  return props.activeColor.value === option.value;
});

const getCheckStyle = (color, optionIndex) => {
  const lightColors = ['#FFFFFF', '#FAFF09']
  if (optionIndex === 5 || lightColors.includes(color)) return { color: '#000' };
  return { color: '#FFF' };
}

onMounted(() => {
  const isMatrix = props.icons.every((row) => Array.isArray(row));
  if (!isMatrix) throw new Error("icon props must be 2d array");
});
</script>

<template>
  <div class="option-grid-ctn">
    <div class="option-row" v-for="(row, rowIndex) in icons" :key="rowIndex">
      <div
        class="option"
        v-for="(option, optionIndex) in row"
        :key="optionIndex"
        @click.stop.prevent="handleClick(option)"
      >
        <i :class="option.icon" :style="option.style"></i>
        <i
            class="fas fa-check active-check"
            :style="getCheckStyle(option.value, optionIndex)"
            v-if="isActive(option)"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.option-grid-ctn {
  display: flex;
  flex-direction: column;
  padding: 5px;
  border-radius: 5px;
  background-color: #fff;
  z-index: 3;
}
.option-row {
  display: flex;
  flex-direction: row;
}
.option {
  border-radius: 50%;
  cursor: pointer;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.option:hover {
  background-color: #DBDBDB;
}
.active-check {
  position: absolute;
}
</style>
