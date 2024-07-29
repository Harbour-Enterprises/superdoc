<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import ToolbarButtonIcon from './ToolbarButtonIcon.vue';
import DropdownOptions from './DropdownOptions.vue';
import ToggleSlider from './ToggleSlider.vue';
import IconGrid from './IconGrid.vue';
import ToolbarItem from './ToolbarItem'
import LinkInput from './LinkInput.vue';

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
  alignment,
  bulletedList,
  numberedList,
  indentLeft,
  indentRight,
  overflow,
  zoom,
  undo,
  redo,
  search
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
  zoom,
  undo,
  redo,
  separator,
  fontButton,
  fontSize,
  bold,
  italic,
  underline,
  colorButton,
  separator,
  link,
  image,
  separator,
  alignment,
  bulletedList,
  numberedList,
  indentRight,
  indentLeft,
  separator,
  search,
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

const toolbarItemsMobile = ref([
  bold,
  italic,
  underline,
  indentRight,
  indentLeft,
  search,
  overflow
].map((item) => item.name))

const toolbarItemsTablet = ref([
  ...toolbarItemsMobile.value,
  ...[
    fontButton,
    fontSize,
    alignment,
    bulletedList,
    numberedList,
    overflow
  ].map((item) => item.name)
])

const overflowItems = ref([]);

let windowResizeTimeout = null;

const debounceSetOverflowItems = () => {
  clearTimeout(windowResizeTimeout);
  windowResizeTimeout = setTimeout(() => {
    setOverflowItems();
  }, 500);
}

const setOverflowItems = () => {
  const windowWidth = window.innerWidth;
  const mobileBreakpoint = 700;
  const tabletBreakpoint = 800;

  overflowItems.value = [];
  const items = [];
  const toolbarItemsBreakpoint = [];

  // mobile
  if (windowWidth < mobileBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsMobile.value);
  // tablet
  if (windowWidth >= mobileBreakpoint && windowWidth < tabletBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsTablet.value);
  // desktop
  if (windowWidth >= tabletBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsDesktop.value);

  // get intersection of mobile and toolbar items
  toolbarItems.value.forEach(item => {
    if (!toolbarItemsBreakpoint.includes(item.name) && item.type !== 'separator') {
      items.push(item);
    }
  })

  overflowItems.value = items;
  console.log("Overflow items", overflowItems.value)
};

const overflowIconGrid = computed(() => [overflowItems.value.map((item) => (
    {
      label: item.name,
      icon: item.overflowIcon || null,
      value: 'test'
    }
))]);

onMounted(() => {
  window.addEventListener('resize', debounceSetOverflowItems);
})

onUnmounted(() => {
  window.addEventListener('resize', debounceSetOverflowItems);
})

const desktopExclude = ['overflow'];
const toolbarItemsDesktop = ref(toolbarItems.value.map((item) => item.name).filter((name) => !desktopExclude.includes(name)));

const mobileBreakpoint = (item) => toolbarItemsMobile.value.includes(item.name);
const tabletBreakpoint = (item) => toolbarItemsTablet.value.includes(item.name);
const desktopBreakpoint = (item) => toolbarItemsDesktop.value.includes(item.name);

const alignments = [
  [
    {label: 'Left', icon: 'fa-align-left', value: 'left'},
    {label: 'Center', icon: 'fa-align-center', value: 'center'},
    {label: 'Right', icon: 'fa-align-right', value: 'right'},
    {label: 'Justify', icon: 'fa-align-justify', value: 'justify'},
  ]
]

const makeColorOption = (label, color) => {
  return {
    label,
    icon: 'fa-circle',
    value: color,
    style: {
      color,
      boxShadow: "0 0 5px 1px rgba(0, 0, 0, 0.1)",
      borderRadius: "50%",
      fontSize: "1.25em",
    }
  }
}

const colors = [
  [
    makeColorOption('Red', 'red'),
    makeColorOption('Blue', 'blue'),
    makeColorOption('Green', 'green')
  ],
  [
    makeColorOption('Yellow', 'yellow'),
    makeColorOption('Purple', 'purple'),
    makeColorOption('Orange', 'orange')
  ],
  [
    makeColorOption('Black', 'black'),
    makeColorOption('White', 'white'),
    makeColorOption('Gray', 'gray')
  ],
  [
    makeColorOption('Pink', 'pink'),
    makeColorOption('Brown', 'brown'),
    makeColorOption('Cyan', 'cyan')
  ],
]

// no units
const fontSizeOptions = [
  {label: '8', value: 8},
  {label: '9', value: 9},
  {label: '10', value: 10},
  {label: '11', value: 11},
  {label: '12', value: 12},
  {label: '14', value: 14},
  {label: '18', value: 18},
  {label: '24', value: 24},
  {label: '30', value: 30},
  {label: '36', value: 36},
  {label: '48', value: 48},
  {label: '60', value: 60},
  {label: '72', value: 72},
  {label: '96', value: 96}
]

const zoomOptions = [
  {label: '50%', value: 0.5},
  {label: '75%', value: 0.75},
  {label: '90%', value: 0.9},
  {label: '100%', value: 1},
  {label: '125%', value: 1.25},
  {label: '150%', value: 1.5},
  {label: '200%', value: 2},
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
const showOptions = (item, name) => item?.name === name && item?.active;

const executeItemCommands = (item, argument = null) => {
  console.log("Executing item commands", item, argument)
  const {preCommand, postCommand, command} = item;

  if (preCommand) {
    console.log("Calling precommand", item, argument)
    const preCommandResult = preCommand(item, argument);
    if (preCommandResult) argument = preCommandResult;
    console.log("Precommand result", preCommandResult)
  }

  if (command) {
    console.log("Executing command", command, argument)
    emit('command', {command, argument});
  }

  if (postCommand) {
    console.log("Calling postcommand", item, argument)
    postCommand(item, argument);
  }
}

const handleToolbarButtonClick = (item, argument = null) => {
  executeItemCommands(item, argument);
}

const handleToolbarButtonTextSubmit = (item, argument) => {
  executeItemCommands(item, argument);
}

const onTextSelectionChange = (marks, selectionText = null) => {
  toolbarItems.value.forEach((item) => {
    if (item.onTextSelectionChange) {
      item.onTextSelectionChange(item, selectionText);
    }

    // handle selection
    const correspondingMark = marks.find((mark) => mark.type.name === item.name);
    if (correspondingMark && item.onTextMarkSelection) {
      item.onTextMarkSelection(item, correspondingMark);
    }
  });
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
      mobile: mobileBreakpoint(item),
      tablet: tabletBreakpoint(item),
      desktop: desktopBreakpoint(item),
    }"
    class="toolbar-item-ctn">

      <!-- toolbar separator -->
      <ToolbarSeparator v-if="isSeparator(item)" />

      <!-- Toolbar button -->
      <ToolbarButton v-if="isButton(item)"
        :disabled="item.disabled"
        :active="item.active"
        :tooltip="item.tooltip"
        :tooltip-visible="item.tooltipVisible"
        :name="item.name"
        :icon="item.icon"
        :label="item.label"
        :has-caret="item.hasCaret"
        :inline-text-input-visible="item.inlineTextInputVisible"
        :icon-color="item.iconColor"
        :has-icon="hasIcon(item)"
        @mouseenter="handleButtonMouseEnter(item)"
        @mouseleave="handleButtonMouseLeave(item)"
        @textSubmit="(argument) => handleToolbarButtonTextSubmit(item, argument)"
        @buttonClick="handleToolbarButtonClick(item)">

          <!-- font dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontFamilyDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="fonts"/>

          <!-- zoom dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'zoomDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="zoomOptions"/>
          
          <!-- font size dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontSizeDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="fontSizeOptions"/>

          <!-- color picker  -->
          <IconGrid
            v-if="showOptions(item.childItem, 'colorOptions')"
            :icons="colors"
            @select="(color) => handleToolbarButtonClick(item.childItem, color)"/>

          <!-- alignment options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'alignmentOptions')"
          :icons="alignments"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>

          <!-- link input -->
          <LinkInput v-if="showOptions(item.childItem, 'linkInput')"
          :initial-url="item.childItem.argument?.href || ''"
          @submit="(anchor) => handleToolbarButtonClick(item.childItem, anchor)"
          @cancel="handleToolbarButtonClick({...item.childItem, command: null})"/>

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
  width: 6%;
  margin: 0 1%;
}
</style>