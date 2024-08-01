<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'
import { ref, computed } from 'vue';

const emit = defineEmits(['buttonClick', 'textSubmit']);

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: null,
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
  inlineTextInputVisible: {
    type: Boolean,
    default: false,
  },
  isNarrow: {
    type: Boolean,
    default: false,
  },
  isWide: {
    type: Boolean,
    default: false,
  }
});

const fullTooltip = computed(() => {
  let tooltip = props.tooltip;
  if (props.disabled) {
    tooltip += ' (disabled)';
  }
  return tooltip;
})

const inlineTextInput = ref(props.label || '');

const handleClick = () => {
  emit('buttonClick')
}

const handleInputSubmit = () => {
  emit('textSubmit', inlineTextInput.value);
}
</script>

<template>
  <div
      class="toolbar-item">
      <div class="tooltip" :style="{display: tooltipVisible ? 'initial' : 'none', width: `${fullTooltip.length * 5}px`}">
        <span>{{ fullTooltip }}</span>
      </div>

      <div @click="handleClick"
      class="toolbar-button"
      :class="{ active: props.active, disabled, narrow: isNarrow, wide: isWide}">
        <span class="button-label" v-if="label">
          <input v-if="inlineTextInputVisible"
          v-model="inlineTextInput"
          @keydown.enter.prevent="handleInputSubmit"
          type="text"
          class="button-text-input"
          :id="'inlineTextInput-' + name"/>

          <span v-else>{{label}}</span>
        </span>
        
        <ToolbarButtonIcon
          v-if="hasIcon"
          :color="iconColor"
          class="icon"
          :icon="icon"
          :name="name">
        </ToolbarButtonIcon>

        <font-awesome-icon v-if="hasCaret"
        class="caret"
        :icon="active ? 'fa-caret-up' : 'fa-caret-down'"
        :style="{opacity: disabled ? 0.6 : 1}"
        />
      </div>
      <slot></slot>
  </div>
</template>

<style scoped>
.toolbar-item {
  position: relative;
}

.toolbar-button {
  height: 32px;
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
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 100;
  /* margin-right: 1%; */
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
  left: 50%;
  transform: translateX(-50%);
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
.caret {
  font-size: .6em;
}
.button-text-input {
  background-color: #c8d0d8;
  border: none;
  font-size: 1em;
}

.button-text-input:focus {
  outline: none;
}

/* .button-text-input {
  font-size: 16px;
  width: 70%;
  border-radius: 5px;
  margin-right: 1em;
  border: 1px solid #ddd;
} */
</style>