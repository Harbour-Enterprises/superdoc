<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'
import { ref, computed } from 'vue';

const emit = defineEmits(['command', 'toggle', 'select']);
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: null,
  },
  iconColor: {
    type: String,
    default: null,
  },
  command: {
    type: String,
    required: true,
  },
  commandArgument: {
    type: null,
    required: false,
  },
  tooltip: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  hasCaret: {
    type: Boolean,
    default: false,
  },
  hasNestedOptions: {
    type: Boolean,
    default: false,
  },
  hasIcon: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const tooltipVisible = ref(false)
const tooltipTimeout = ref(null)

const fullTooltip = computed(() => {
  let tooltip = props.tooltip;
  if (props.disabled) {
    tooltip += ' (disabled)';
  }
  return tooltip;
})

const nestedOptionTimeout = ref(null)
const handleButtonMouseEnter = () => {
  console.log("mouse enter")
  // set 400ms delay before showing tooltip
  const now = Date.now();
  const delay = 1000;
  tooltipTimeout.value = setTimeout(() => {
    if (now + delay <= Date.now()) {
      tooltipVisible.value = true;
    }
  }, delay);
}
const handleButtonMouseLeave = () => {
  console.log("mouse leave")
  tooltipVisible.value = false;
  clearTimeout(tooltipTimeout.value);
}
const handleOptionMouseEnter = (option) => {
  // clearTimeout(nestedOptionTimeout.value);
  option.active = true;
}
const handleNestedOptionMouseEnter = (option) => {
  // clearTimeout(nestedOptionTimeout.value);
  // option.active = true;
}
const handleOptionMouseLeave = (option) => {
  // nestedOptionTimeout.value = setTimeout(() => {
  //   option.active = false;
  // }, 400);
  option.active = false;
}
const handleButtonClick = () => {
  if (props.disabled) return;
  console.log('handleButtonClick', props);
  if (props.hasNestedOptions) {
    emit('toggle', {active: props.active === true ? false : true, name: props.name});
    return;
  }
  emit('command', {command: props.command, argument: props.commandArgument})
}
const handleOptionClick = (option) => {
  const {label, fontName, fontWeight} = option;
  console.log('handleOptionClick', label, fontName, fontWeight);
  // one command for all dropdown options
  emit('select', {name: props.name, command: props.command, label, fontName, fontWeight});
}
</script>

<template>
  <div
      class="toolbar-button"
      :class="{ active: props.active, disabled: disabled}"
      @mouseenter="handleButtonMouseEnter"
      @mouseleave="handleButtonMouseLeave"
      @click.stop.prevent="handleButtonClick">
      <div class="tooltip" :style="{display: tooltipVisible ? 'initial' : 'none', width: `${fullTooltip.length * 5}px`}">
        <span>{{ fullTooltip }}</span>
      </div>

      <span class="button-label" v-if="label">{{label}}</span>
      
      <ToolbarButtonIcon
        v-if="hasIcon"
        :style="{marginRight: hasCaret ? '8px' : null}"
        :color="iconColor"
        class="icon"
        :name="name">
      </ToolbarButtonIcon>

      <font-awesome-icon v-if="hasCaret"
      class="caret"
      :icon="active ? 'fa-caret-up' : 'fa-caret-down'"
      :style="{opacity: disabled ? 0.6 : 1}"
      />

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
  position: relative;
}
.toolbar-button:hover {
  color: black;
  background-color: #d8dee5;
}
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}
.button-label {
  font-weight: 100;
  margin-right: 8px;
}

.left, .right {
  width: 50%;
  height: 100%;
  background-color: #DBDBDB;
  border-radius: 60%;
}

.tooltip {
  position: absolute;
  top: -30px;
  background-color: white;
  padding: 5px;
  border-radius: 3%;
  color: #555555;
  font-size: 10px;
  text-align: center;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

.disabled {
  cursor: default;
}
.disabled .icon, .disabled .caret, .disabled .button-label {
  opacity: .6;
}

</style>