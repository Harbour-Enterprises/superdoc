<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { onMounted } from "vue";

const emit = defineEmits(["select"]);
const props = defineProps({
  icons: {
    type: Array,
    required: true,
  },
});

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
        @click.stop.prevent="emit('select', option.value)"
      >
        <FontAwesomeIcon :icon="option.icon" :style="option.style" />
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
  width: 20px;
  height: 20px;
  margin: 2px;
  cursor: pointer;
  padding: 1px;
  text-align: center;
}

.option:hover {
  background-color: #ddd;
}
</style>
