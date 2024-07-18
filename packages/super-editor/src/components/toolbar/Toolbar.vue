<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import ToolbarButtonIcon from './ToolbarButtonIcon.vue';
import DropdownOptions from './DropdownOptions.vue';
import ToggleSlider from './ToggleSlider.vue';
import ColorPicker from './ColorPicker.vue';

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

const toolbarItem = (options) => {
  const types = ['button', 'options', 'separator'];
  if (!types.includes(options.type)) {
    console.error('Invalid toolbar item type:',options.type);
    return;
  }
  return {
    type: options.type,
    name: options.name,

    // handlers
    onTextSelection: options.onTextSelection || null,
    preCommand: options.preCommand || null,

    command: options.command || null,
    argument: options.argument || null,
    childItem: options.childItem || null,
    parentItem: options.parentItem || null,
    active: options.active || false,

    // icon properties
    icon: options.icon || null,
    iconColor: options.iconColor || null,
    hasCaret: options.hasCaret || false,

    // tooltip properties
    tooltip: options.tooltip || null,
    tooltipVisible: options.tooltipVisible || false,
    tooltipTimeout: options.tooltipTimeout || null,

    label: options.label || null,
    disabled: options.disabled || false,
  }
}

const emit = defineEmits(['command', 'toggle', 'select']);
const separator =  toolbarItem({
  type: 'separator',
  name: 'separator',
  icon: 'fa-grip-lines-vertical',
})

// toolbar items
const fontButton = toolbarItem({
  type: 'button',
  name: 'fontFamily',
  tooltip: "Font",
  label: "Font",
  hasCaret: true,
  preCommand(item) {
    clearTimeout(item.tooltipTimeout);
    item.tooltipVisible = false;
    item.active = item.active ? false : true;
    item.childItem.active = item.childItem.active ? false : true;
  },
  onTextSelection(item, mark) {
    item.label = mark.attrs.font;
  },
});
// font button and dropdown
const fontOptions = toolbarItem({
  type: 'options',
  name: 'fontFamilyDropdown',
  preCommand(item) {
    item.active = false;
  },
  command: 'toggleFont',
})
fontButton.childItem = fontOptions;
fontOptions.parentItem = fontButton;

const fontSize =  toolbarItem({
  type: 'button',
  name: 'size',
  command: 'changeFontSize',
  icon: null,
  active: false,
  tooltip: "Font size",
  label: "12pt",
  argument: '12pt',
});

const bold = 
  toolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    tooltip: "Bold",
});

const italic = toolbarItem({
  type: 'button',
  name: 'italic',
  command: 'toggleItalic',
  icon: 'fa fa-italic',
  active: false,
  tooltip: "Italic",
});

const underline = toolbarItem({
  type: 'button',
  name: 'underline',
  command: 'toggleUnderline',
  icon: 'fa fa-underline',
  active: false,
  tooltip: "Underline",
});

// color
const colorButton = toolbarItem({
  type: 'button',
  name: 'color',
  icon: 'fa fa-font',
  active: false,
  tooltip: "Text color",
  preCommand(item) {
    item.childItem.active = item.childItem.active ? false : true;
  },
  // argument: 'red',
  // colorOptions: [
  //   [{label: 'Red', value: 'red'}, {label: 'Blue', value: 'blue'}, {label: 'Green', value: 'green'}],
  //   [{label: 'Yellow', value: 'yellow'}, {label: 'Purple', value: 'purple'}, {label: 'Orange', value: 'orange'}],
  //   [{label: 'Black', value: 'black'}, {label: 'White', value: 'white'}, {label: 'Gray', value: 'gray'}],
  //   [{label: 'Pink', value: 'pink'}, {label: 'Brown', value: 'brown'}, {label: 'Cyan', value: 'cyan'}],
  // ]
});
const colorOptions = {
  name: 'colorOptions',
  type: 'options',
  command: 'toggleColor',
}
colorButton.childItem = colorOptions;
colorOptions.parentItem = colorButton;

const toolbarItemsDisplay = ref([
  // font
  fontButton,

  // TODO: Change this - make dropdown work
  fontSize,

  // separator
  separator,

  // separator
  // { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },

  bold,
  italic,
  underline,

  colorButton,

  // separator
  separator,
  
  // link
  toolbarItem({
    type: 'button',
    name: 'link',
    command: 'toggleLink',
    icon: 'fa-link',
    active: false,
    tooltip: "Link",
  }),
  
  // image
  toolbarItem({
    type: 'button',
    name: 'image',
    command: 'toggleImage',
    icon: 'fa-image',
    active: false,
    tooltip: "Image",
    disabled: true,
  }),

  // separator
  separator,

  // paragraph
  toolbarItem({
    type: 'button',
    name: 'paragraph',
    command: 'toggleParagraph',
    icon: 'fa-align-left',
    active: false,
    tooltip: "Paragraph",
  }),

  // bullet list
  toolbarItem({
    type: 'button',
    name: 'list',
    command: 'toggleList',
    icon: 'fa-list',
    active: false,
    tooltip: "Bullet list",
  }),

  // number list
  toolbarItem({
    type: 'button',
    name: 'numberedlist',
    command: 'toggleNumberedList',
    icon: 'fa-list-numeric',
    active: false,
    tooltip: "Numbered list",
  }),

  // indent left
  toolbarItem({
    type: 'button',
    name: 'indentleft',
    command: 'toggleIndentLeft',
    icon: 'fa-indent',
    active: false,
    tooltip: "Left indent",
  }),

  // indent right
  toolbarItem({
    type: 'button',
    name: 'indentright',
    command: 'toggleIndentRight',
    icon: 'fa-indent',
    active: false,
    tooltip: "Right indent",
  }),

  // overflow
  toolbarItem({
    type: 'button',
    name: 'overflow',
    command: 'toggleOverflow',
    icon: 'fa-ellipsis-vertical',
    active: false,
    tooltip: "More options",
  }),


  // suggesting
  // TODO: Restore this later - removing for initial milestone
  // toolbarItem({
  //   type: 'toggle',
  //   label: 'Suggesting',
  //   name: 'suggesting',
  //   command: null,
  //   icon: null,
  //   active: false,
  //   tooltip: "Suggesting",
  // }),
])

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

const handleCommand = ({command, argument}) => {
  console.debug('Toolbar command HANDLER', command, argument);
  emit('command', {command, argument});
}

const handleToggle = ({active, name}) => {
  const item = toolbarItemsDisplay.value.find((item) => item.name === name);
  console.debug('Toolbar toggle HANDLER', active, name, item);
  if (!item) return;
  item.active = active;
}

const handleSelect = ({name, command, argument}) => {
  // console.debug('Toolbar select handler', name, command, label, fontName, fontWeight);
  console.debug('Toolbar select handler', name, command, argument);
  const item = toolbarItemsDisplay.value.find((item) => item.name === name);
  if (item) item.active = false;
  emit('command', {command, argument});
}

const handleToolbarButtonClick = (item) => {
  const {preCommand, command, argument} = item;
  if (preCommand) {
    console.log("Calling precommand")
    preCommand(item);
  }
  console.log("Toolbar button click:", command, argument)
  emit('command', {command, argument});
}

// const handleDropdownOptionClick = (command, option) => {;
//   if (item.preCommand) item.preCommand(item);
//   emit('command', {command: item.command, argument: item.argument});
// }

const onSelectionChange = (marks) => {
  toolbarItemsDisplay.value.forEach((item) => {
    // reset
    if (item.childItem) item.childItem.active = false;
    item.active = false;

    // handle selection
    if (item.onTextSelection) {
      const correspondingMark = marks.find((mark) => mark.type.name === item.name);
      if (correspondingMark) item.onTextSelection(item, correspondingMark);
    }
    // const markNames = marks.map((mark) => mark.type.name);
    // const activeExcludes = ['dropdown', 'colorpicker']
    // if (markNames.includes(item.name) && !activeExcludes.includes(item.type)) {
    //   item.active = true;
    // } else item.active = false;

    // // reset
    // if (item.name === 'color') {
    //   item.iconColor = '#47484a';
    //   const mark = marks.find((mark) => mark.type.name === item.name) || null;
    //   console.log('color mark', mark);
    //   if (!mark) return;
    //   item.iconColor = mark.attrs?.color;
    //   return;
    // }

    // if (item.name === 'fontFamily') {
    //   const mark = marks.find((mark) => mark.type.name === item.name) || null;
    //   item.label = "Font";
    //   if (!mark) return;

    //   const font = mark.attrs?.font;
    //   if (!font) item.label = 'Font';
    //   item.label = font;
    // }
  });
}

defineExpose({
  onSelectionChange
});
</script>

<template>
  <div class="toolbar">
    <div v-for="item, index in toolbarItemsDisplay" :key="index">

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
            @optionClick="(option) => handleToolbarButtonClick({
              command: item.childItem.command,
              preCommand: item.childItem.preCommand(item.childItem),
              argument: option
            })"
            :fonts="fonts"/>
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