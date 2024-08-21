<script setup>
import { computed, ref, h } from 'vue';
import { NDropdown, NTooltip, NSelect } from 'naive-ui';

const emit = defineEmits(['select']);
const props = defineProps({
  state: {
    type: String,
    required: false,
  },
});

const renderIcon = (icon) => {
  return () => {
    return h('i', { class: icon });
  };
}

const options = [
  {
    label: 'Internal',
    key: 'internal',
    icon: renderIcon('fal fa-user-check'),
    iconString: 'fal fa-user-check',
    backgroundColor: '#CDE6E6',
  },
  {
    label: 'External',
    key: 'external',
    icon: renderIcon('fal fa-users'),
    iconString: 'fal fa-users',
    backgroundColor: '#F5CFDA',
  },
];

const getState = computed(() => {
  return options.find((o) => o.key === activeState.value)?.label;
});

const getStyle = computed(() => {
  if (!props.state) return {};

  const activeOption = options.find((o) => o.key === activeState.value);
  if (!activeOption) return {};
  if (activeOption.key === 'internal') {
    return { backgroundColor: activeOption.backgroundColor };
  } else {
    return { backgroundColor: activeOption.backgroundColor };
  }
})

const handleSelect = (key) => {
  activeState.value = key;
  activeIcon.value = options.find((o) => o.key === key)?.iconString;
  emit('select', key);
};

const activeState = ref(props.state);
const activeIcon = ref(null);
handleSelect(props.state || 'internal');

</script>

<template>
  <div class="internal-dropdown" :style="getStyle">
    <n-dropdown trigger="click" :options="options" @select="handleSelect">
      <div class="comment-option">
        <i :class="activeIcon"></i>
        <div class="option-state">{{ getState }}</div>
        <i class="fas fa-caret-down dropdown-caret"></i>
      </div>
    </n-dropdown>
  </div>
</template>

<style scoped>
.comment-option {
  display: flex;
  align-items: center;
}
.comment-option i {
  font-size: 12px;
}
.option-state {
  margin: 0 7px;
}
.dropdown-caret {
  font-size: 16px !important;
}
.internal-dropdown {
  transition: all 250ms ease;
  display: inline-block;
  cursor: pointer;
  border-radius: 50px;
  padding: 2px 8px;
}
.internal-dropdown:hover {
  background-color: #F3F3F5;
}
</style>