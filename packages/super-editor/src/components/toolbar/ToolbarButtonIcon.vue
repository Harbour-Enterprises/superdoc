<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  name: {
    name: String,
    required: true,
  }
});

const iconMap = {
  bold: "fa fa-bold",
  italic: "fa fa-italic",
  underline: "fa fa-underline",
  color: "fa fa-font",
  link: "fa-link",
  image: "fa-image",
  paragraph: "fa-align-left",
  list: "fa-list",
  numberedlist: "fa-list-numeric",
  indentleft: "fa-indent",
  indentright: "fa-indent",
  overflow: "fa-ellipsis-vertical"
}

</script>

<template>
  <div :class="['toolbar-button-icon', name]">
    <font-awesome-icon :icon="iconMap[name]" />
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
  border-bottom: solid 1.9px #47484a;
  position: relative;
  top: -2.6px;
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