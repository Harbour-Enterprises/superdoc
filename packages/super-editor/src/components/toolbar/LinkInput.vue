<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref, computed } from 'vue';


const emit = defineEmits(['submit', 'cancel']);
const props = defineProps({
    initialText: {
        type: String,
        default: '',
    },
    initialUrl: {
        type: String,
        default: '',
    }
});

const handleSubmit = () => {
    if (rawUrl.value === '' || validUrl.value) {
        emit('submit', { text: text.value, href: url.value });
        return;
    }
    console.log('invalid url')
    urlError.value = true;
}

const handleCancel = () => {
    emit('cancel');
}

const urlError = ref(false);

const text = ref(props.initialText);
const rawUrl = ref(props.initialUrl);
const url = computed(() => {
    if (!rawUrl.value.startsWith('http')) return 'http://' + rawUrl.value;
    return rawUrl.value;
});

const validUrl = computed(() => {
    const urlSplit = url.value.split('.').filter(Boolean);
    return url.value.includes('.') && urlSplit.length > 1;
})


</script>

<template>
    <div class="link-input-ctn">
        <!-- text input -->
        <!-- <div class="input-row">
            <input type="text" placeholder="Text"
            v-model="text"
            @keydown.escape="handleCancel"
            @keydown.enter="handleSubmit" />
        </div> -->
        
        <!-- url input -->
        <div class="input-row">
            <input type="text" placeholder="Address" 
            :class="{error: urlError}"
            v-model="rawUrl"
            @keydown="urlError = false"
            @keydown.escape="handleCancel"
            @keydown.enter="handleSubmit" />
            <span class="submit" @click="handleSubmit">Apply</span>
        </div>

        <!-- link preview -->
        <div class="input-row">
            <FontAwesomeIcon icon="link" :style="{marginRight: '5px'}" />
            <a v-if="validUrl" :href="url" target="_blank">{{ rawUrl }}</a>
            <span v-else>{{ rawUrl }}</span>
        </div>


    </div>
</template>

<style scoped>
.link-input-ctn {
    width: 250px;
    /* height: 100px; */
    display: flex;
    flex-direction: column;
    padding: 1em;
    border-radius: 5px;
    background-color: #fff;
    position: absolute;
    top: 32px;
    left: 0;
}

.input-row {
    margin-bottom: 1em;
    align-content: baseline;
}

.input-row input {
    font-size: 16px;
    width: 70%;
    padding: 5px;
    border-radius: 5px;
    margin-right: 1em;
    border: 1px solid #ddd;
}

.input-row {
    font-size: 16px;
}

.error {
    border-color: red !important;
    background-color: #ff00001a;

}

.submit {
    cursor: pointer;
}
</style>
