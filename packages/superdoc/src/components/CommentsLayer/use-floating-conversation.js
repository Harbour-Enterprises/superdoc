import { ref, reactive } from 'vue';

export default function useFloatingConveration(params) {
  const id = params.conversationId;
  const conversation = ref(params);
  const position = reactive({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });
  const offset = ref(0);

  return {
    id,
    conversation,
    position,
    offset
  }
}
