<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
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

onMounted(() => {
  const isMatrix = props.icons.every((row) => Array.isArray(row));
  if (!isMatrix) throw new Error("icon props must be 2d array");
});
</script>

<template>
  <div class="option-grid-ctn">TEST {{ activeColor }}
    <div class="option-row" v-for="(row, rowIndex) in icons" :key="rowIndex">
      <div
        class="option"
        v-for="(option, optionIndex) in row"
        :key="optionIndex"
        @click.stop.prevent="handleClick(option)"
      >
        <FontAwesomeIcon :icon="option.icon" :style="option.style" />
        <FontAwesomeIcon icon="fa-check" class="active-check" v-if="isActive(option)" />
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
