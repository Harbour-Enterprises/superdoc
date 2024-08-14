<script setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ref, computed } from "vue";

const emit = defineEmits(["submit", "cancel"]);
const props = defineProps({
  initialText: {
    type: String,
    default: "",
  },
  initialUrl: {
    type: String,
    default: "",
  },
  showInput: {
    type: Boolean,
    default: true,
  },
  showLink: {
    type: Boolean,
    default: true,
  },
});

const handleSubmit = () => {
  if (rawUrl.value === "" || validUrl.value) {
    emit("submit", { text: text.value, href: url.value });
    return;
  }
  console.log("invalid url");
  urlError.value = true;
};

const handleCancel = () => {
  emit("cancel");
};

const urlError = ref(false);

const text = ref(props.initialText);
const rawUrl = ref(props.initialUrl);
const url = computed(() => {
  if (!rawUrl.value.startsWith("http")) return "http://" + rawUrl.value;
  return rawUrl.value;
});

const validUrl = computed(() => {
  const urlSplit = url.value.split(".").filter(Boolean);
  return url.value.includes(".") && urlSplit.length > 1;
});
</script>

<template>
  <div class="link-input-ctn">
    <!-- url input -->
    <div class="input-row" v-if="showInput">
      <input
        type="text"
        placeholder="Address"
        :class="{ error: urlError }"
        v-model="rawUrl"
        @keydown="urlError = false"
      />
      <span class="submit" @click="handleSubmit">
        <FontAwesomeIcon icon="check-square" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.hasBottomMargin {
  margin-bottom: 1em;
}

.link-input-ctn {
  width: 250px;
  display: flex;
  flex-direction: column;
  padding: 1em;
  border-radius: 5px;
  background-color: #fff;
}

.input-row {
  align-content: baseline;
  display: flex;
  align-items: center;
}

.input-row input {
  font-size: 14px;
  flex-grow: 1;
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
