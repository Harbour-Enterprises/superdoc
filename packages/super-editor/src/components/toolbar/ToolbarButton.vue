<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'
import { ref } from 'vue';

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
  isDropdown: {
    type: Boolean,
    default: false,
  },
  dropdownOptions: {
    type: Array,
    default: () => [],
  },
  isToggle: {
    type: Boolean,
    default: false,
  },
  hasIcon: {
    type: Boolean,
    default: false,
  },
});
const tooltipVisible = ref(false)
const tooltipTimeout = ref(null)
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

const handleButtonClick = () => {
  console.log('handleButtonClick', props);
  if (props.isDropdown) {
    emit('toggle', {active: props.active === true ? false : true, name: props.name});
    return;
  }
  emit('command', {command: props.command, argument: props.commandArgument})
}
const handleOptionClick = ({label, value}) => {
  console.log('handleOptionClick', label, value);
  // one command for all dropdown options
  emit('select', {command: props.command, label, value});
}
</script>

<template>
  <div
      class="toolbar-button"
      :class="{ active: props.active, dropdown: isDropdown, toggle: isToggle}"
      @mouseenter="handleButtonMouseEnter"
      @mouseleave="handleButtonMouseLeave"
      @click.stop.prevent="handleButtonClick">
      <div class="tooltip" :style="{display: tooltipVisible ? 'initial' : 'none', width: `${tooltip.length * 5}px`}">
        <span>{{ tooltip }}</span>
      </div>

      <span class="button-label" v-if="label">{{label}}</span>
      
      <ToolbarButtonIcon
        v-if="hasIcon"
        :style="{marginRight: isDropdown ? '8px' : null}"
        class="icon"
        :name="name">
      </ToolbarButtonIcon>

      <font-awesome-icon v-if="isDropdown" :icon="active ? 'fa-caret-up' : 'fa-caret-down'" />
      <div class="dropdown-options-ctn" v-if="isDropdown"
      :style="{display: props.active ? 'initial' : 'none'}">
        <div v-for="option in dropdownOptions"
          :key="option.label"
          class="dropdown-option-outer"
          @click="handleOptionClick(option)">
            <div class="dropdown-option-inner">
              {{option.label}}
            </div>
          </div>
      </div>

      <div class="toggle-ctn" v-if="isToggle">
          <div :class="{'toggle-slider': true, on: active}"></div>

          <div class="toggle-background-ctn">
            <div class="left"></div>
            <div class="right"></div>
            <div class="center"></div>
          </div>
      </div>
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
/* .icon {
  margin-right: 8px;
} */

/* toggle */
.toggle-ctn {
  width: 40px;
  height: 20px;
  position: relative;
}
.toggle-slider {
  position: absolute;
  background-color: #555555;
  height: 15px;
  width: 15px;
  z-index: 1;
  border-radius: 60%;
  transform: translateY(-50%);
  top: 50%;
  left: 4px;
}
.toggle-slider.on {
  left: 22px;
}
.toggle-background {
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
}

.toggle-background-ctn {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.center {
  background-color: #DBDBDB;
  position: absolute;
  left: 50%;
  width: 50%;
  height: 100%;
  transform: translateX(-50%);
}

.left, .right {
  width: 50%;
  height: 100%;
  background-color: #DBDBDB;
  border-radius: 60%;
}

.dropdown {
  overflow: visible;
}

.dropdown-options-ctn {
  position: absolute;
  top: 30px;
  width: 150px;
  left: 0;
  margin: 0 auto;
  background-color: white;
  z-index: 1;
  border-radius: 3%;
}

.dropdown-option-outer:hover {
  background-color: #DBDBDB;
}

.dropdown-option-inner {
  padding: 1em;
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

</style>