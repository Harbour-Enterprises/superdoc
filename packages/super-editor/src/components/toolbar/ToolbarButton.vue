<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ToolbarButtonIcon from './ToolbarButtonIcon.vue'

const emit = defineEmits(['command']);
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: null,
  },
  command: {
    type: String,
    required: true,
  },
  tooltip: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  isDropdown: {
    type: Boolean,
    default: false,
  },
  isToggle: {
    type: Boolean,
    default: false,
  },
  hasIcon: {
    type: Boolean,
    default: false,
  },
});

const handleClick = () => emit('command', props.command);
</script>

<template>
  <div
      class="toolbar-button"
      :class="{ active: props.active }"
      :title="tooltip"
      @click.stop.prevent="handleClick">

      <span class="button-text" v-if="text">{{text}}</span>
      
      <ToolbarButtonIcon
        v-if="hasIcon"
        :style="{marginRight: isDropdown ? '8px' : null}"
        class="icon"
        :name="name">
      </ToolbarButtonIcon>

      <font-awesome-icon v-if="isDropdown" icon="fa-caret-down" />
      <div class="toggle-ctn" v-if="isToggle">
          <div :class="{'toggle-slider': true, on: active}"></div>

          <div class="toggle-background-ctn">
            <div class="left"></div>
            <div class="right"></div>
            <div class="center"></div>
          </div>
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
.toolbar-button:active,
.active {
  background-color: #c8d0d8;
}
.button-text {
  font-weight: 100;
  margin-right: 8px;
}
/* .icon {
  margin-right: 8px;
} */

/* toggle */
.toggle-ctn {
  width: 40px;
  height: 20px;
  position: relative;
}
.toggle-slider {
  position: absolute;
  background-color: #555555;
  height: 15px;
  width: 15px;
  z-index: 1;
  border-radius: 60%;
  transform: translateY(-50%);
  top: 50%;
  left: 4px;
}
.toggle-slider.on {
  left: 22px;
}
.toggle-background {
  display: flex;
  position: absolute;
  width: 100%;
  height: 100%;
}

.toggle-background-ctn {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.center {
  background-color: #DBDBDB;
  position: absolute;
  left: 50%;
  width: 50%;
  height: 100%;
  transform: translateX(-50%);
}

.left, .right {
  width: 50%;
  height: 100%;
  background-color: #DBDBDB;
  border-radius: 60%;
}

</style>