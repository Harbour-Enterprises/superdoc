<script setup>
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'
import { ref, computed } from 'vue';

const emit = defineEmits(['buttonClick', 'textSubmit']);

const props = defineProps({
  iconColor: {
    type: String,
    default: null,
  },
  active: {
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
  },
  toolbarItem: {
    type: Object,
    required: true,
  },
  label: {
    type: String,
    default: null,
  },
});

const {
  name,
  active,
  icon,
  label,
  hideLabel,
  iconColor,
  hasCaret,
  disabled,
  inlineTextInputVisible,
  hasInlineTextInput,
  minWidth,
  style,
} = props.toolbarItem;


const inlineTextInput = ref(props.label);
const inlineInput = ref(null);

const handleClick = () => {
  if (hasInlineTextInput) {
    inlineInput.value?.focus();
    inlineInput.value?.select();
  }
  emit('buttonClick')
}

const handleInputSubmit = () => {
  emit('textSubmit', inlineTextInput.value);
  inlineTextInput.value = '';
}

const getStyle = computed(() => {
  if (style.value) return style.value;
  return {
    minWidth: props.minWidth,
  }
})

</script>

<template>
  <div class="toolbar-item" :style="getStyle">

      <div @click="handleClick"
          class="toolbar-button"
          :class="{ active, disabled, narrow: isNarrow, wide: isWide, 'has-inline-text-input': hasInlineTextInput}">

        <ToolbarButtonIcon
            v-if="icon"
            :color="iconColor"
            class="toolbar-icon"
            :icon="icon"
            :name="name">
        </ToolbarButtonIcon>

        <div class="button-label" v-if="label && !hideLabel && !inlineTextInputVisible">
          {{label}}
        </div>

        <span v-if=inlineTextInputVisible>
          <input
              v-model="inlineTextInput"
              :placeholder="label"
              @keydown.enter.prevent="handleInputSubmit"
              type="text"
              class="button-text-input"
              :id="'inlineTextInput-' + name" 
              autoccomplete="off"
              ref="inlineInput" />
        </span>

        <i v-if="hasCaret"
            class="dropdown-caret fas"
            :class="active ? 'fa-caret-up' : 'fa-caret-down'"
            :style="{opacity: disabled ? 0.6 : 1}"></i>

      </div>
  </div>
</template>

<style scoped>
.toolbar-item {
  position: relative;
  z-index: 100;
  margin: 0 1px;
  min-width: 30px;
}

.toolbar-button {
  padding: 0;
  height: 32px;
  max-height: 32px;
  border-radius: 6px;
  margin-top: 3.5px;
  margin-bottom: 4px;

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
.dropdown-caret {
  margin-right: 5px;
}
.toolbar-button:hover {
  background-color: #DBDBDB;
}
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}
.button-label {
  overflow: hidden;
  width: 100%;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 15px;
  margin: 5px;
  text-align: center;
}
.toolbar-icon {
  margin: 0 5px;
}

.left, .right {
  width: 50%;
  height: 100%;
  background-color: #DBDBDB;
  border-radius: 60%;
}

.has-inline-text-input:hover {
  cursor: text;
}

.disabled {
  cursor: default;
}
.disabled:hover {
  cursor: default;
  background-color: initial;
}
.disabled .toolbar-icon, .disabled .caret, .disabled .button-label {
  opacity: .35;
}
.caret {
  font-size: 1em;
  padding-left: 2px;
  padding-right: 2px;
}
.button-text-input {
  border: none;
  outline: none;
  border-radius: 4px;
  text-align: center;
  width: 30px;
  font-size: 14px;
  margin-right: 5px;
  font-weight: 100;
  background-color: transparent;
  padding: 2px 0;
  outline: none;
  border: 1px solid #d8dee5;
}
</style>