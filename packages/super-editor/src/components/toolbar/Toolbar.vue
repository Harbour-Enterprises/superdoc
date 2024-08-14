<script setup>
import { ref, getCurrentInstance, reactive } from 'vue';
import ButtonGroup from './ButtonGroup.vue';

const { proxy } = getCurrentInstance();
const inlineMenuMouseX = ref(0);
const inlineMenuMouseY = ref(0);
const linkInputItem = ref(null);

const handleSelectionChange = ({mark, coords}) => {
  if (mark?.type.name === 'link') {
    linkInputItem.value = {
      url: mark.attrs.href,
    };
  } else {
    linkInputItem.value = null;
  }

  inlineMenuMouseX.value = coords.left;
  inlineMenuMouseY.value = coords.top + 20;
}

const emit = defineEmits([
  'command',
  'toggle',
  'select'
]);


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

const updateState = (marks) => {
  // const mark = marks.find(mark => mark.type.name === 'link') || null;
  // handleSelectionChange({mark, coords});
  // emit('select', {mark, coords})
}

const leftItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'left');
const centerItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'center');
const rightItems = proxy.$toolbar.toolbarItems.filter(item => item.group.value === 'right');

const handleCommand = (params) => {
  proxy.$toolbar.emitCommand(params);
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