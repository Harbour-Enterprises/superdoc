<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue';
import ToolbarButton from './ToolbarButton.vue';

/**
 * The toolbar should be completly decoupled from the editor.
 * It shouldn't be dependant on Editor.js or vice-versa.
 * One toolbar should work for many editors.
*/

const emit = defineEmits(['command']);
const toolbarItems = ref([
  { type: 'button', name: 'bold', command: 'toggleBold', icon: 'fa fa-bold', active: false },
  { type: 'button', name: 'italic', command: 'toggleItalic', icon: 'fa fa-italic', active: false },
])

const isButton = (item) => item.type === 'button';

const handleCommand = (command) => {
  console.debug('Toolbar command', command);
  emit('command', command);
}

const onSelectionChange = ({ editor, transaction }) => {
  const { selection } = editor.view.state;
  const marks = selection.$head.marks();

  toolbarItems.value.forEach((item) => {
    const hasActiveMark = marks.find((mark) => mark.type.name === item.name);
    if (hasActiveMark) item.active = true;
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
          v-if="isButton" :command="item.command"
          :active="item.active"
          @command="handleCommand">
          <font-awesome-icon :icon="item.icon" />
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