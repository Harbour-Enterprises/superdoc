<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';

/**
 * The toolbar should be completly decoupled from the editor.
 * It shouldn't be dependant on Editor.js or vice-versa.
 * One toolbar should work for many editors.
*/

const emit = defineEmits(['command']);
const toolbarItems = ref([
  // font
  // { type: 'dropdown', name: 'font', command: null, icon: 'fa-grip-lines-vertical', active: false },

  // separator
  // { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },

  // font size

  // separator
  // { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },

  // bold
  { type: 'button', name: 'bold', command: 'toggleBold', icon: 'fa fa-bold', active: false },
  // italic
  { type: 'button', name: 'italic', command: 'toggleItalic', icon: 'fa fa-italic', active: false },
  // underline
  { type: 'button', name: 'underline', command: 'toggleUnderline', icon: 'fa fa-underline', active: false },

  // color
  { type: 'button', name: 'color', command: 'toggleColor', icon: 'fa fa-font', active: false },

  // separator
  { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },
  
  // link
  { type: 'button', name: 'link', command: null, icon: 'fa-link', active: false },
  
  // image
  { type: 'button', name: 'link', command: null, icon: 'fa-image', active: false },

  // separator
  { type: 'separator', name: 'separator', command: null, icon: 'fa-grip-lines-vertical', active: false },

  // paragraph
  { type: 'button', name: 'paragraph', command: null, icon: 'fa-align-left', active: false },

  // bullet list
  { type: 'button', name: 'list', command: null, icon: 'fa-list', active: false },

  // number list
  { type: 'button', name: 'numberedlist', command: null, icon: 'fa-list-numeric', active: false },

  // indent left
  { type: 'button', name: 'indentleft', command: null, icon: 'fa-indent', active: false },

  // indent right
  { type: 'button', name: 'indentright', command: null, icon: 'fa-indent', active: false },

  // overflow
  { type: 'button', name: 'overflow', command: null, icon: 'fa-ellipsis-vertical', active: false },

  // suggesting
])

const isButton = (item) => item.type === 'button';
const isSeparator = (item) => item.type === 'separator';

const handleCommand = (command) => {
  console.debug('Toolbar command', command);
  emit('command', command);
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
      <ToolbarButton
          v-if="isButton(item)" :command="item.command"
          :active="item.active"
          @command="handleCommand">
          <font-awesome-icon :icon="item.icon" />
      </ToolbarButton>

      <ToolbarSeparator v-if="isSeparator(item)"> </ToolbarSeparator>

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