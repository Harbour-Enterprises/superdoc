<script setup>
import { ref, getCurrentInstance, reactive, computed } from "vue";
import ButtonGroup from "./ButtonGroup.vue";

const { proxy } = getCurrentInstance();
const emit = defineEmits(["command", "toggle", "select"]);

const leftItems = proxy.$toolbar.toolbarItems.filter((item) => item.group.value === "left");
const centerItems = proxy.$toolbar.toolbarItems.filter((item) => item.group.value === "center");
const rightItems = proxy.$toolbar.toolbarItems.filter((item) => item.group.value === "right");

const showLeftSide = computed(() => proxy.$toolbar.config?.toolbarGroups?.includes("left"));
const showRightSide = computed(() => proxy.$toolbar.config?.toolbarGroups?.includes("right"));

const handleCommand = ({ item, argument }) => {
  proxy.$toolbar.emitCommand({ item, argument });
};
</script>

<template>
  <div class="superdoc-toolbar">
    <ButtonGroup
      v-if="showLeftSide"
      :toolbar-items="leftItems"
      position="left"
      @command="handleCommand"
      class="superdoc-toolbar-group-side"
    />
    <ButtonGroup
      :toolbar-items="centerItems"
      position="center"
      @command="handleCommand"
    />
    <ButtonGroup
      v-if="showRightSide"
      :toolbar-items="rightItems"
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
  height: 39px;
  justify-content: space-between;
}
.superdoc-toolbar-group-side {
  width: 200px;
}
</style>
