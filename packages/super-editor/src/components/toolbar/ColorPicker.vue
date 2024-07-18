<script setup>

const emit = defineEmits(['colorSelect']);
const props = defineProps({
    colorOptions: {
        type: Array,
        required: true,
    },
});

</script>

<template>
    <div class="color-picker-ctn">
        <div class="color-row" v-for="(row, index) in colorOptions" :key="index">
            <div class="color-option" v-for="option in row"
            @click.stop.prevent="emit('colorSelect', {value: option.value})"
            :key="option.label" 
            :style="{backgroundColor: option.value}"></div>
        </div>
    </div>
</template>

<style scoped>
.color-picker-ctn {
    display: flex;
    flex-direction: column;
    padding: 5px;
    border-radius: 5px;
    background-color: #fff;
    position: absolute;
    top: 32px;
    left: 0;
}
.color-row {
    display: flex;
    flex-direction: row;
}
.color-option {
    width: 20px;
    height: 20px;
    margin: 2px;
    border-radius: 50%;
    cursor: pointer;
    border: solid 1px #ddd;
}

.color-option:hover {
    box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.1);
}
</style>
