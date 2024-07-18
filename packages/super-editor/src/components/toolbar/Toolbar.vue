<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import ToolbarButtonIcon from './ToolbarButtonIcon.vue';
import DropdownOptions from './DropdownOptions.vue';
import ToggleSlider from './ToggleSlider.vue';
import ColorPicker from './ColorPicker.vue';
import ToolbarItem from './ToolbarItem'

import {
  bold,
  fontButton,
  fontSize,
  separator,
  italic,
  underline,
  colorButton,
  link,
  image,
  paragraph,
  bulletedList,
  numberedList,
  indentLeft,
  indentRight,
  overflow
} from './items/index'

/**
 * The toolbar should be completly decoupled from the editor.
 * It shouldn't be dependant on Editor.js or vice-versa.
 * One toolbar should work for many editors.
*/

const handleButtonMouseEnter = (item) => {
  if (item.childItem?.active) return;
  const now = Date.now();
  const timeout = 800;
  item.tooltipTimeout = setTimeout(() => {
    if (now + timeout <= Date.now()) {
      item.tooltipVisible = true;
    }
  }, timeout);
}

const handleButtonMouseLeave = (item) => {
  // cancel timeout
  clearTimeout(item.tooltipTimeout);
  item.tooltipVisible = false;
}

const emit = defineEmits(['command', 'toggle', 'select']);

const toolbarItems = ref([
  fontButton,
  fontSize,
  separator,
  bold,
  italic,
  underline,
  colorButton,
  separator,
  link,
  image,
  separator,
  paragraph,
  bulletedList,
  numberedList,
  indentLeft,
  indentRight,
  overflow,
  // suggesting
  // TODO: Restore this later - removing for initial milestone
  // ToolbarItem({
  //   type: 'toggle',
  //   label: 'Suggesting',
  //   name: 'suggesting',
  //   command: null,
  //   icon: null,
  //   active: false,
  //   tooltip: "Suggesting",
  // }),
])

const colors = [
  [
    {label: 'Red', value: 'red'},
    {label: 'Blue', value: 'blue'}, 
    {label: 'Green', value: 'green'}
  ],
  [
    {label: 'Yellow', value: 'yellow'},
    {label: 'Purple', value: 'purple'},
    {label: 'Orange', value: 'orange'}
  ],
  [
    {label: 'Black', value: 'black'},
    {label: 'White', value: 'white'},
    {label: 'Gray', value: 'gray'}],
  [
    {label: 'Pink', value: 'pink'}, 
    {label: 'Brown', value: 'brown'}, 
    {label: 'Cyan', value: 'cyan'}
  ],
]

const fonts = [
      {
        label: 'Georgia',
        fontName: 'Georgia, serif',
        fontWeight: 400,
      },
      {
        label: 'Arial',
        fontName: 'Arial, sans-serif',
        fontWeight: 400,
      },
      {
        label: 'Courier New',
        fontName: 'Courier New, monospace',
        fontWeight: 400,
        active: false,
        options: [
          { label: 'Regular', fontWeight: 400 },
          { label: 'Bold', fontWeight: 700 },
        ],
      },
      {
        label: 'Times New Roman',
        fontName: 'Times New Roman, serif',
        fontWeight: 400,
      },
    ]
const isButton = (item) => item.type === 'button';
const isSeparator = (item) => item.type === 'separator';
const isDropdown = (item) => item.type === 'dropdown';
const isToggle = (item) => item.type === 'toggle';
const isColorPicker = (item) => item.type === 'colorpicker';
const hasIcon = (item) => item.icon !== null;

const handleToolbarButtonClick = (item, argument = null) => {
  const {preCommand, postCommand, command} = item;

  if (preCommand) {
    console.log("Calling precommand", item)
    preCommand(item, argument);
  }

  if (command) {
    console.log("Toolbar button click:", command, argument)
    emit('command', {command, argument});
  }

  if (postCommand) {
    console.log("Calling postcommand", item, argument)
    postCommand(item, argument);
  }
}

// const handleDropdownOptionClick = (command, option) => {;
//   if (item.preCommand) item.preCommand(item);
//   emit('command', {command: item.command, argument: item.argument});
// }

const onSelectionChange = (marks) => {
  toolbarItems.value.forEach((item) => {
    if (item.onSelectionChange) {
      item.onSelectionChange(item);
    }

    // handle selection
    const correspondingMark = marks.find((mark) => mark.type.name === item.name);
    if (correspondingMark && item.onMarkSelection) {
      item.onMarkSelection(item, correspondingMark);
    }
  });
}

defineExpose({
  onSelectionChange
});
</script>

<template>
  <div class="toolbar">
    <div v-for="item, index in toolbarItems" :key="index">

      <!-- toolbar separator -->
      <ToolbarSeparator v-if="isSeparator(item)" />

      <!-- Toolbar button -->
      <ToolbarButton v-if="isButton(item)"
        :disabled="item.disabled"
        :active="item.active"
        :tooltip="item.tooltip"
        :tooltip-visible="item.tooltipVisible"
        :name="item.name"
        :label="item.label"
        :has-caret="item.hasCaret"
        :icon-color="item.iconColor"
        :has-icon="hasIcon(item)"
        @mouseenter="handleButtonMouseEnter(item)"
        @mouseleave="handleButtonMouseLeave(item)"
        @click="handleToolbarButtonClick(item)">

          <!-- font dropdown -->
          <DropdownOptions
            v-if="item.childItem?.name ==='fontFamilyDropdown' && item.childItem.active"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :fonts="fonts"/>
      
          <!-- color picker  -->
          <ColorPicker
            v-if="item.childItem?.name === 'colorOptions' && item.childItem.active"
            :color-options="colors"
            @colorSelect="(color) => handleToolbarButtonClick(item.childItem, color)"/>
      </ToolbarButton>

      <!-- toolbar options -->
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  width: 100%;
  height: 39px;
  border-top: 1px solid #e8e8e863;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
}
</style>