<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
});

const colorStyle = computed(() => {
  if (props.name === 'color') return {
    borderBottomColor: props.color
  };
  return { color: props.color };
});

</script>

<template>
  <div :class="['toolbar-button-icon', name]"  :style="colorStyle">
    <font-awesome-icon :icon="icon"/>
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
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}

.color {
  border-bottom: solid 4px #47484a;
  position: relative;
  top: -2px;
  width: 16px;
  text-align: center;
}

.color svg {
  zoom: .75;
}

.indentleft {
  transform: scale(-1, 1);
}


/* 'bold'
italic'
underline'
'color'
'separator'
'link'
'separator'
paragraph'
'list'
'numberedlist'
'indentleft'
'indentright'
'overflow' */
</style>