<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const emit = defineEmits(['select']);
const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    command: {
        type: String,
        required: true,
    },
});

const handleOptionMouseEnter = (option) => {
  // clearTimeout(nestedOptionTimeout.value);
    option.active = true;
}
const handleNestedOptionMouseEnter = (option) => {
  // clearTimeout(nestedOptionTimeout.value);
  // option.active = true;
}
const handleOptionMouseLeave = (option) => {
  // nestedOptionTimeout.value = setTimeout(() => {
  //   option.active = false;
  // }, 400);
    option.active = false;
}
const handleOptionClick = (option) => {
    const {label, fontName, fontWeight} = option;
    console.log('handleOptionClick', label, fontName, fontWeight);
    // one command for all dropdown options
    const argument = {label, fontName, fontWeight};
    emit('select', {name: props.name, command: props.command, argument});
}
</script>

<template>
    <div class="dropdown-options-ctn">
            <div v-for="(option, index) in props.item.dropdownOptions" :key="option.label" class="dropdown-option-outer"
            @mouseenter="handleOptionMouseEnter(option)" 
            @mouseleave="handleOptionMouseLeave(option)"
            @click.stop.prevent="handleOptionClick(option)">
                <div class="dropdown-option-inner" :style="{fontFamily: option.fontName}">
                    {{option.label}}
                    <font-awesome-icon v-if="option.options" :icon="'angle-right'" />
                </div>

                <div class="nested-dropdown-options"
                    :style="{fontFamily: option.fontName, top: (44*Number(index))+'px', display: option.active ? 'initial' : 'none'}">
                    <div v-for="nestedOption in option.options"
                        @mouseenter="handleNestedOptionMouseEnter(option)"
                        :key="nestedOption.label" class="dropdown-option-outer"
                        @click.stop.prevent="handleOptionClick({...nestedOption, fontName: option.fontName})">
                        <div class="dropdown-option-inner" :style="{fontWeight: nestedOption.fontWeight}">
                            {{ nestedOption.label }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
</template>

<style scoped>

.dropdown {
    overflow: visible;
}

.dropdown-options-ctn {
    top: 30px;
}

/* both */
.dropdown-options-ctn, .nested-dropdown-options {
    position: absolute;
    width: 150px;
    left: 0;
    margin: 0 auto;
    background-color: white;
    z-index: 1;
    border-radius: 5%;
}

.nested-dropdown-options {
    left: 150px;
}

.dropdown-option-outer:hover {
    background-color: #DBDBDB;
}

.dropdown-option-inner {
    padding: 1em;
    display: flex;
    justify-content: space-between;
}

</style>
