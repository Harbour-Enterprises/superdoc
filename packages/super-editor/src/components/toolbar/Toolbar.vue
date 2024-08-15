<script setup>
import { ref, getCurrentInstance, reactive } from 'vue';
import ButtonGroup from './ButtonGroup.vue';

const { proxy } = getCurrentInstance();
const inlineMenuMouseX = ref(0);
const inlineMenuMouseY = ref(0);
const linkInputItem = ref(null);

const emit = defineEmits([
  'command',
  'toggle',
  'select'
]);

const leftItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'left');
const centerItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'center');
const rightItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'right');

const handleCommand = ({ item, argument }) => {
  proxy.$toolbar.emitCommand({ item, argument});
}
</script>

<template>
  <div class="toolbar">
  
    <!-- inline link input -->
    <!-- <LinkInput
        v-if="linkInputItem"
        :show-input="false"
        :show-link="true"
        :style="{top: inlineMenuMouseY+'px', left: inlineMenuMouseX+'px', zIndex: 3}"
        :initial-url="linkInputItem.url" /> -->

    <ButtonGroup :toolbar-items="leftItems" position="left" @command="handleCommand" />
    <ButtonGroup :toolbar-items="centerItems" position="center" @command="handleCommand" />
    <ButtonGroup :toolbar-items="rightItems" position="right" @command="handleCommand" />

  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  width: 100%;
  height: 39px;
  justify-content: space-between;
}
</style>