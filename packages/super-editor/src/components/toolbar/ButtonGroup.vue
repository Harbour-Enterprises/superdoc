<script setup>
import { computed, ref } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import { NDropdown, NTooltip, NSelect } from 'naive-ui';

const emit = defineEmits([
  'command',
]);

const props = defineProps({
  toolbarItems: {
      type: Array,
      required: true,
  },
  position: {
    type: String,
    default: 'left',
  }
});

const currentItem = ref(null);
const styleMap = {
  left: {
    paddingLeft: '20px',
    minWidth: '150px',
    justifyContent: 'flex-start',
  },
  right: {
    paddingRight: '20px',
    minWidth: '150px',
    justifyContent: 'flex-end',
  },
  default: {
    flexGrow: 1,
    paddingLeft: '20px',
    paddingRight: '20px',
    justifyContent: 'center',
  },
};

const getPositionStyle = computed(() => {
  return styleMap[props.position] || styleMap.default;
});

const isButton = (item) => item.type === 'button';
const isDropdown = (item) => item.type === 'dropdown';
const isSeparator = (item) => item.type === 'separator';
const handleToolbarButtonClick = (item, argument = null) => {
  currentItem.value = item;
  currentItem.value.expand = true;
  if (item.disabled.value) return;
  emit('command', { item, argument });
}

const handleToolbarButtonTextSubmit = (item, argument) => {
  if (item.disabled.value) return;
  currentItem.value = null;
  emit('command', { item, argument });
}

const closeDropdowns = () => {
  if (!currentItem.value) return;
  currentItem.value.expand = false;
  currentItem.value = null;
}

const handleSelect = (item, argument) => {
  closeDropdowns();
  emit('command', { item, argument });
}

const handleClickOutside = (e) => {
  closeDropdowns();
}

</script>

<template>

  <div :style="getPositionStyle" class="button-group">
    
    <div v-for="item, index in toolbarItems"
      :key="index"
      :class="{
        narrow: item.isNarrow.value,
        wide: item.isWide.value,
        mobile: item.isMobile.value,
        tablet: item.isTablet.value,
        desktop: item.isDesktop.value,
      }"
      class="toolbar-item-ctn">

      <!-- toolbar separator -->
      <ToolbarSeparator v-if="isSeparator(item)" style="width: 20px" />

      <!-- Toolbar button -->
      <n-dropdown
          v-if="isDropdown(item) && item.nestedOptions?.value?.length"
          :options="item.nestedOptions.value"
          :trigger="item.disabled.value ? null : 'click'"
          :show="item.expand.value"
          size="medium"
          placement="bottom-start"
          class="toolbar-button toolbar-dropdown"
          @select="handleSelect(item, $event)"
          @clickoutside="handleClickOutside">
            <n-tooltip trigger="hover">
              <template #trigger>
                <ToolbarButton
                  :toolbar-item="item"
                  @textSubmit="handleToolbarButtonTextSubmit(item, $event)"
                  @buttonClick="handleToolbarButtonClick(item)" />
              </template>
              <div v-if="item.tooltip">
                {{ item.tooltip }}
                <span v-if="item.disabled.value">(disabled)</span>
              </div>
            </n-tooltip>
      </n-dropdown>

      <n-tooltip trigger="hover" v-else-if="isButton(item)">
        <template #trigger>
          <ToolbarButton
            :toolbar-item="item"
            @textSubmit="handleToolbarButtonTextSubmit(item, $event)"
            @buttonClick="handleToolbarButtonClick(item)" />
        </template>
        <div v-if="item.tooltip">
          {{ item.tooltip }} 
          <span v-if="item.disabled.value">(disabled)</span>
        </div>
      </n-tooltip>
    </div>
  </div>
</template>

<style>
.n-dropdown {
  border-radius: 8px;
  min-width: 80px;
}
.n-tooltip, .n-popover {
  background-color: #333333 !important;
  font-size: 14px;
  border-radius: 8px !important;
}
.n-dropdown-option-body:hover::before,
.n-dropdown-option-body:hover::after {
  background-color: #d8dee5 !important;
}
.toolbar-dropdown {
  cursor: pointer;
}
</style>

<style scoped>
.button-group {
  display: flex;
}

@media (max-width: 700px) {
  .mobile {
    display: initial;
  }
}

@media (min-width: 700px) and (max-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: initial;
  }
}

@media (min-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: none;
  }
  .desktop {
    display: initial;
  }
}
</style>