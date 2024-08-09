<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineProps } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import DropdownOptions from './DropdownOptions.vue';
import IconGrid from './IconGrid.vue';
import LinkInput from './LinkInput.vue';
import { ToolbarItem } from './ToolbarItem';
import { sanitizeNumber } from './helpers';
import { undoDepth, redoDepth } from 'prosemirror-history';

const props = defineProps({
  toolbarItems: {
      type: Array,
      required: true,
  },
  editorInstance: {
    type: Object,
    required: true,
  }
});

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

const emit = defineEmits([
  'command',
  'toggle',
  'select'
]);


const isButton = (item) => item.type === 'button';
const isSeparator = (item) => item.type === 'separator';
const isDropdown = (item) => item.type === 'dropdown';
const isToggle = (item) => item.type === 'toggle';
const isColorPicker = (item) => item.type === 'colorpicker';
const hasIcon = (item) => item.icon !== null;
const showOptions = (item, name) => item?.name === name && item?.active;

let currentItem = null;

const closeOpenDropdowns = (currentItem) => {
  const parentToolbarItems = props.toolbarItems.filter(item => item.childItem);
  parentToolbarItems.forEach((item) => {
    if (currentItem) {
      if (item.name === currentItem.name) return;
      if (item.childItem && item.childItem.name === currentItem.name) return;
    }
    item.active = false;
    item.childItem.active = false;
    item.inlineTextInputVisible = false;
  });
}

const handleToolbarButtonClick = (item, argument = null) => {
  currentItem = item;
  if (item.disabled) return;
  emit('command', {item, argument});
}

const handleDropdownOptionMouseEnter = (item, optionIndex) => {
  const option = item.options[optionIndex];
  option.active = true
}

const handleDropdownOptionMouseLeave = (item, optionIndex) => {
  const option = item.options[optionIndex];
  option.active = false
}

const handleToolbarButtonTextSubmit = (item, argument) => {
  if (item.disabled) return;
  emit('command', {item, argument});

}

const onTextSelectionChange = (marks, selectionText = null, coords = null) => {
  console.log("Text selection change", marks, selectionText)
  const mark = marks.find(mark => mark.type.name === 'link') || null;
  emit('select', {mark, coords})
}

defineExpose({
  onTextSelectionChange
});
</script>

<template>
  <div class="toolbar">

    <div v-for="item, index in toolbarItems"
    :key="index"
    :class="{
      narrow: item.isNarrow,
      wide: item.isWide,
      mobile: item.isMobile,
      tablet: item.isTablet,
      desktop: item.isDesktop,
    }"
    class="toolbar-item-ctn">

      <!-- toolbar separator -->
      <ToolbarSeparator v-if="isSeparator(item)" />

      <!-- Toolbar button -->
      <ToolbarButton v-if="isButton(item)"
        :disabled="item.disabled"
        :active="item.getActiveState(editorInstance)"
        :tooltip="item.tooltip"
        :tooltip-visible="item.tooltipVisible"
        :name="item.name"
        :icon="item.getIcon(editorInstance)"
        :label="item.getActiveLabel(editorInstance) || item.defaultLabel"
        :hide-label="item.hideLabel"
        :has-caret="item.hasCaret"
        :inline-text-input-visible="item.inlineTextInputVisible"
        :has-inline-text-input="item.hasInlineTextInput"
        :icon-color="item.getIconColor(editorInstance)"
        :has-icon="hasIcon(item)"
        @mouseenter="handleButtonMouseEnter(item)"
        @mouseleave="handleButtonMouseLeave(item)"
        @textSubmit="(argument) => handleToolbarButtonTextSubmit(item, argument)"
        @buttonClick="handleToolbarButtonClick(item)">

          <!-- font dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontFamilyDropdown')"
            :command="item.childItem.command"
            @optionEnter="(optionIndex) => handleDropdownOptionMouseEnter(item.childItem, optionIndex)"
            @optionLeave="(optionIndex) => handleDropdownOptionMouseLeave(item.childItem, optionIndex)"
            @optionClick="(option) => handleToolbarButtonClick(item, option)"
            :options="item.childItem.options"/>

          <!-- zoom dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'zoomDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="item.childItem.options"/>
          
          <!-- font size dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontSizeDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="item.options"/>

          <!-- color picker  -->
          <IconGrid
            v-if="showOptions(item.childItem, 'colorOptions')"
            :icons="item.childItem.options"
            @select="(color) => handleToolbarButtonClick(item, color)"/>

          <!-- alignment options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'alignmentOptions')"
          :icons="item.childItem.options"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>

          <!-- link input -->
          <LinkInput v-if="showOptions(item.childItem, 'linkInput')"
          :initial-url="item.getAttr(editorInstance, 'href')"
          @submit="(anchor) => handleToolbarButtonClick(item.childItem, anchor)" />

          <!-- overflow options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'overflowOptions')"
          :icons="overflowIconGrid"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>
      </ToolbarButton>

      <!-- toolbar options -->
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  width: 100%;
  height: 39px;
  border-top: 1px solid #e8e8e863;
  border-bottom: 1px solid #e8e8e8;
  justify-content: space-around;
}

.toolbar-item-ctn {
  width: 4.5%;
  margin: 0 .2%;
  display: none;
}


@media (max-width: 700px) {
  .mobile {
    display: initial;
  }
}

@media (min-width: 700px) and (max-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: initial;
  }
}

@media (min-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: none;
  }
  .desktop {
    display: initial;
  }
}

.narrow {
  width: 1%;
  margin: 0 .2%;
}

.wide {
  width: 10%;
  margin: 0 1%;
}
</style>