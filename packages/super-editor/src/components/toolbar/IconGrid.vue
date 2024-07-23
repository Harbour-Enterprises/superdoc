<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const emit = defineEmits(['select']);
const props = defineProps({
    icons: {
        type: Array,
        required: true,
    },
});

</script>

<template>
    <div class="option-grid-ctn">
        <div class="option-row" v-for="(row, rowIndex) in icons" :key="rowIndex">
            <div class="option" v-for="(option, optionIndex) in row"
            :key="optionIndex"
            @click.stop.prevent="emit('select', option.value)">
                <FontAwesomeIcon :icon="option.icon" :style="option.style"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
.option-grid-ctn {
    display: flex;
    flex-direction: column;
    padding: 5px;
    border-radius: 5px;
    background-color: #fff;
    position: absolute;
    top: 32px;
    left: 0;
}
.option-row {
    display: flex;
    flex-direction: row;
}
.option {
    width: 20px;
    height: 20px;
    /* font-size: 1.25em; */
    margin: 2px;
    /* border-radius: 50%; */
    cursor: pointer;
    /* border: solid 1px #ddd; */
    /* box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.1); */
}

.color-option:hover {
    box-shadow: 0 0 5px 3px rgba(0, 0, 0, 0.1);
}
</style>
