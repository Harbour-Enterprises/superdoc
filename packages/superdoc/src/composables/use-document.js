import { ref, reactive, toRaw } from 'vue';
import { useField } from './use-field';
import useConversation from '@/components/CommentsLayer/use-conversation';

export default function useDocument(params) {
  const id = params.id;
  const data = params.data;
  const type = params.type;

  // Placement
  const container = ref(null);
  const pageContainers = ref([]);
  const isReady = ref(false);

  // Modules
  const rawFields = ref(params.fields || []);
  const fields = ref(params.fields?.map((f) => useField(f)) || []);
  const annotations = ref(params.annotations || []);
  const conversations = ref(params.conversations?.map((c) => useConversation(c)) || []);

  const core = ref(null);

  const removeConversation = (conversationId) => {
    const index = conversations.value.findIndex((c) => c.conversationId === conversationId);
    if (index > -1) conversations.value.splice(index, 1);
  }

  return {
    id,
    data,
    type,

    core,

    // Placement
    container,
    pageContainers,
    isReady,

    // Modules
    rawFields,
    fields,
    annotations,
    conversations,

    // Actions
    removeConversation,
  }
}