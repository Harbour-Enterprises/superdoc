<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButton from './ToolbarButton.vue';

const emit = defineEmits(['command']);
const toolbarItems = [
  { type: 'button', command: 'toggleBold', icon: 'fa fa-bold' },
  { type: 'button', command: 'toggleItalic', icon: 'fa fa-italic' },
]

const isButton = (item) => item.type === 'button';

const handleCommand = (command) => {
  console.debug('Toolbar command', command);
  emit('command', command);
}

</script>

<template>
  <div class="toolbar">
    <div v-for="item, index in toolbarItems" :key="index">

      <!-- Toolbar button -->
      <ToolbarButton
          v-if="isButton" :command="item.command"
          @command="handleCommand">
          <font-awesome-icon :icon="item.icon" />
      </ToolbarButton>
      
    </div>
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
  overflow: hidden;
}
.toolbar-button:hover {
  color: black;
  background-color: #d8dee5;
}
.toolbar-button:active {
  background-color: #c8d0d8;
}

.toolbar {
  width: 100%;
  height: 39px;
  border-top: 1px solid #e8e8e863;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
}
</style>