<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'
import { ref, computed } from 'vue';

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
  tooltip: {
    type: String,
    required: true,
  },
  tooltipVisible: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  hasCaret: {
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

const fullTooltip = computed(() => {
  let tooltip = props.tooltip;
  if (props.disabled) {
    tooltip += ' (disabled)';
  }
  return tooltip;
})

</script>

<template>
  <div
      class="toolbar-button"
      :class="{ active: props.active, disabled: disabled}">
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