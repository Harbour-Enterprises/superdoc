<script setup>
import {ref, getCurrentInstance, onMounted, onDeactivated, toRaw, computed} from 'vue';
import ButtonGroup from './ButtonGroup.vue';

const { proxy } = getCurrentInstance();
const emit = defineEmits(['command', 'toggle', 'select']);

const leftItems = ref([]);
const centerItems = ref([]);
const rightItems = ref([]);
const overflowItems = ref([]);

const showLeftSide = computed(() => proxy.$toolbar.config?.toolbarGroups?.includes('left'));
const showRightSide = computed(() => proxy.$toolbar.config?.toolbarGroups?.includes('right'));


onMounted(() => {
  window.addEventListener('resize', onWindowResized);
  getToolbarItems();
});

onDeactivated(() => {
  window.removeEventListener('resize', onWindowResized);
});

const onWindowResized = async () => {
  await proxy.$toolbar.onToolbarResize();
  getToolbarItems();
};

const getToolbarItems = () => {
  leftItems.value = proxy.$toolbar.getToolbarItemByGroup('left');
  centerItems.value = proxy.$toolbar.getToolbarItemByGroup('center');
  rightItems.value = proxy.$toolbar.getToolbarItemByGroup('right');
  overflowItems.value = proxy.$toolbar.overflowItems;
};

const handleCommand = ({ item, argument }) => {
  proxy.$toolbar.emitCommand({ item, argument });
};
</script>

<template>
  <div 
      class="superdoc-toolbar"
  >
    <ButtonGroup 
      v-if="showLeftSide"
      :toolbar-items="toRaw(leftItems)" 
      position="left" 
      @command="handleCommand" 
      class="superdoc-toolbar-group-side" 
    />
    <ButtonGroup 
      :toolbar-items="toRaw(centerItems)" 
      :overflow-items="toRaw(overflowItems)"
      position="center" 
      @command="handleCommand" 
    />
    <ButtonGroup 
      v-if="showRightSide"
      :toolbar-items="toRaw(rightItems)" 
      position="right" 
      @command="handleCommand" 
      class="superdoc-toolbar-group-side"
    />
  </div>
</template>

<style scoped>
.superdoc-toolbar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 4px 16px;
}
@media (max-width: 1120px) {
  .superdoc-toolbar-group-side {
    min-width: auto !important;
  }
}
@media (max-width: 600px)  {
  .superdoc-toolbar {
    padding: 4px 10px;
  }
}
</style>

