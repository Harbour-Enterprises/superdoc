<script setup>
import { defineProps, onMounted, ref } from 'vue';
const props = defineProps({
    fileSource: {
        type: File,
        required: true,
    },
    documentId: {
        type: String,
        required: true,
    },
    fieldClasses: {
        type: Array,
        required: false,
    },
    fieldFormat: {
        type: Object,
        required: false
    }
});

const documentContent = ref('');

const fields = ref([])

const loadFields = (htmlString) => {        
  if (!props.fieldClasses && !props.fieldFormat) return;
  const formatKeys = Object.keys(props.fieldFormat);
    const parser = new DOMParser().parseFromString(htmlString, 'text/html');
    props.fieldClasses.forEach(fieldClass => {
        const fieldElements = parser.querySelectorAll(`.${fieldClass}`);
        fieldElements.forEach((field) => {
            const result = {};
            formatKeys.forEach(key => result[key] = props.fieldFormat[key](field))
            fields.value.push(result);
        });
    });
    console.log("found fields", fields.value)
}

const loadDocument = (file) => {
    // open file
    console.log('loading file', file);
    // read file
    const reader = new FileReader();
    reader.onload = (e) => {
      const htmlString = e.target.result;
      documentContent.value = htmlString;
      loadFields(htmlString);
    }
    reader.readAsText(file);
}

onMounted(() => {
    loadDocument(props.fileSource);
});

</script>

<template>
    <div class="super-editor">
        <div class="super-editor__content" v-html="documentContent"></div>
    </div>
</template>


<style lang="postcss">
.super-editor {
  --header-height: 36px;

  font-family: sans-serif;
  color: #000;
  width: 100%;
  height: 100%;
  position: relative;

  &__header {
    display: flex;
    align-items: center;
    height: var(--header-height);
    padding: 5px 10px;
    background: #fff;
    box-shadow: rgb(0 0 0 / 10%) 0px -1px 0px 0px inset;

    .signer-redlining__yes-no-ctn {
      margin-top: 0;
    }
  }

  &__header-zoom-btns {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__zoom-btn {
    font-size: 18px;
    color: #363636;
    cursor: pointer;
    transition: all 0.2s;

    &--active,
    &:hover {
      color: var(--hrbr-primary-color-active);
    }

    &--disabled {
      color: #848484;
      pointer-events: none;
    }

    i {
      display: block;
    }
  }

  &__main {
    position: absolute;
    top: var(--header-height);
    left: 0;
    right: 0;
    bottom: 0;
  }

  &__document {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    overflow: auto;
    background: #fff;
  }

  &__document-wrapper {
    width: 100%;
    height: auto;
  }

  &__content-container {
    max-height: 0;
    overflow: visible;
  }

  &__content {
    min-width: 800px;
    padding: 38px 75px 75px;
    /* opacity: 0;
    visibility: hidden; */
    transition: opacity 0.3s ease, visibility 0.3s ease;
    transform-origin: 0 0;
  }

  &__content--visible {
    opacity: 1;
    visibility: visible;
  }
}

@media all and (max-width: 768px) {
  .super-editor {
    &__content {
      padding: 30px;
    }
  }
}
</style>
