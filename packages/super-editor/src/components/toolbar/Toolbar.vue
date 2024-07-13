<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import ToolbarButtonIcon from './ToolbarButtonIcon.vue';

/**
 * The toolbar should be completly decoupled from the editor.
 * It shouldn't be dependant on Editor.js or vice-versa.
 * One toolbar should work for many editors.
*/

const toolbarItem = (options) => {
  return {
    type: options.type,
    name: options.name,
    active: options.active,
    dropdownOptions: options.dropdownOptions || null,
    command: options.command || null,
    icon: options.icon || null,
    tooltip: options.tooltip || null,
    text: options.text || null,
    argument: options.argument || null,
  }
}

const emit = defineEmits(['command']);
const separator =  toolbarItem({
  type: 'separator',
  name: 'separator',
  command: null,
  icon: 'fa-grip-lines-vertical',
  active: false,
})
const toolbarItems = ref([
  // font
  toolbarItem({
    type: 'dropdown',
    name: 'arial',
    command: 'toggleFont',
    icon: null,
    active: false,
    tooltip: "Font",
    text: "Font",
    argument: 'Georgia, serif', // TODO: Change this - test only
  }),

  // TODO: Change this - make dropdown work
  toolbarItem({
    type: 'dropdown',
    name: 'size',
    command: 'changeFontSize',
    icon: null,
    active: false,
    tooltip: "Font size",
    text: "12pt",
    argument: '12pt',
  }),

  // separator
  separator,

  // font size

  // separator
  // { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },

  // bold
  toolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    active: false,
    tooltip: "Bold",
  }),

  // italic
  toolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: "Italic",
  }),

  // underline
  toolbarItem({
    type: 'button',
    name: 'underline',
    command: 'toggleUnderline',
    icon: 'fa fa-underline',
    active: false,
    tooltip: "Underline",
  }),

  // color
  toolbarItem({
    type: 'button',
    name: 'color',
    command: 'toggleColor',
    icon: 'fa fa-font',
    active: false,
    tooltip: "Text color",
    argument: 'red',
  }),

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
  }),

  // separator
  separator,

  // paragraph
  toolbarItem({
    type: 'dropdown',
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
    tooltip: "Overflow",
  }),

  // suggesting
  // TODO: Restore this later - removing for initial milestone
  // toolbarItem({
  //   type: 'toggle',
  //   text: 'Suggesting',
  //   name: 'suggesting',
  //   command: null,
  //   icon: null,
  //   active: false,
  //   tooltip: "Suggesting",
  // }),
])

const isButton = (item) => item.type === 'button';
const isSeparator = (item) => item.type === 'separator';
const isDropdown = (item) => item.type === 'dropdown';
const isToggle = (item) => item.type === 'toggle';
const hasIcon = (item) => item.icon !== null;

const handleCommand = (command, argument) => {
  console.debug('Toolbar command', command, argument);
  emit('command', {command, argument});
}

const handleToolbarButtonClick = ({command, argument}) => {;
  console.debug('Toolbar command', command, argument);
  emit('command', {command, argument});
}

const onSelectionChange = (marks) => {
  toolbarItems.value.forEach((item) => {
    if (marks.includes(item.name)) item.active = true;
    else item.active = false;
  });
}

defineExpose({
  onSelectionChange
});
</script>

<template>
  <div class="toolbar">
    <div v-for="item, index in toolbarItems" :key="index">

      <!-- Toolbar button -->
      <ToolbarSeparator v-if="isSeparator(item)"> </ToolbarSeparator>
      <ToolbarButton v-else
          :command="item.command"
          :active="item.active"
          :tooltip="item.tooltip"
          :name="item.name"
          :text="item.text"
          :is-dropdown="isDropdown(item)"
          :is-toggle="isToggle(item)"
          :has-icon="hasIcon(item)"
          @click="handleToolbarButtonClick(item)">
      </ToolbarButton>


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