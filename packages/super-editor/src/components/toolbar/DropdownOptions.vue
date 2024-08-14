<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed } from "vue";

const emit = defineEmits(["optionClick", "optionEnter", "optionLeave"]);
const props = defineProps({
  command: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
});

const dropdownOptionsCtnWidth = computed(() => {
  let greatestWidth = -1;
  props.options.forEach((option) => {
    const { label } = option;
    if (label?.length > greatestWidth) {
      greatestWidth = label.length;
    }
  });
  return `${greatestWidth * 12}px`;
});

const handleOptionMouseEnter = (optionIndex) => {
  emit("optionEnter", optionIndex);
};
const handleOptionMouseLeave = (optionIndex) => {
  emit("optionLeave", optionIndex);
};
const handleNestedOptionMouseEnter = (option) => {
  console.log("nested mouse enter");
  // clearTimeout(nestedOptionTimeout.value);
  option.active = true;
};
const handleOptionClick = (option) => {
  emit("optionClick", option);
};
</script>

<template>
  <div class="dropdown-options-ctn" :style="{ width: dropdownOptionsCtnWidth }">
    <div
      v-for="(option, index) in options"
      :key="option.label"
      class="dropdown-option-outer"
      @mouseenter="handleOptionMouseEnter(index)"
      @mouseleave="handleOptionMouseLeave(index)"
      @click.stop.prevent="handleOptionClick(option)"
    >
      <div
        class="dropdown-option-inner"
        :style="{ fontFamily: option.fontName }"
      >
        {{ option.label }}
        <font-awesome-icon v-if="option.options" :icon="'angle-right'" />
      </div>

      <div
        class="nested-dropdown-options"
        v-if="option.active"
        :style="{
          fontFamily: option.fontName,
          top: 50 * Number(index) + 'px',
          left: dropdownOptionsCtnWidth,
        }"
      >
        <div
          v-for="nestedOption in option.options"
          :key="nestedOption.label"
          class="dropdown-option-outer"
          @click.stop.prevent="
            handleOptionClick({
              ...nestedOption,
              fontName: option.fontName,
              label: option.label + ' ' + nestedOption.label,
            })
          "
        >
          <div
            class="dropdown-option-inner"
            :style="{ fontWeight: nestedOption.fontWeight }"
          >
            {{ nestedOption.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  overflow: visible;
}

.dropdown-options-ctn {
  top: 35px;
  border: 1px solid #99999933;
}

/* both */
.dropdown-options-ctn,
.nested-dropdown-options {
  position: absolute;
  width: 150px;
  min-width: 73px;
  left: 0;
  margin: 0 auto;
  background-color: white;
  z-index: 1;
  border-radius: 8px;
}

.dropdown-option-outer {
  cursor: pointer;
}

.dropdown-option-outer:hover {
  background-color: #dbdbdb;
}

.dropdown-option-inner {
  padding: 10px;
  display: flex;
  justify-content: space-between;
}
</style>
