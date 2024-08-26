import { ref, reactive, toRaw } from 'vue';
import { useField } from './use-field';
import useConversation from '@/components/CommentsLayer/use-conversation';

export default function useDocument(params, superdocConfig) {
  const id = params.id;
  const data = params.data;
  const type = params.type;
  const config = superdocConfig;

  // Placement
  const container = ref(null);
  const pageContainers = ref([]);
  const isReady = ref(false);

  // For docx
  const editorRef = {};
  const setEditor = (ref) => Object.assign(editorRef, ref);
  const getEditor = () => Object.keys(editorRef).length ? editorRef : null;

  // Comments
  const removeComments = () => {
    conversationsBackup.value = conversations.value;
    conversations.value = [];
  };

  const restoreComments = () => {
    conversations.value = conversationsBackup.value;
  };

  // Modules
  const rawFields = ref(params.fields || []);
  const fields = ref(params.fields?.map((f) => useField(f)) || []);
  const annotations = ref(params.annotations || []);
  const conversations = ref(initConversations());
  const conversationsBackup = ref([]);

  function initConversations() {
    if (!config.modules.comments) return [];
    return params.conversations?.map((c) => useConversation(c)) || [];
  };

  const core = ref(null);

  const removeConversation = (conversationId) => {
    const index = conversations.value.findIndex((c) => c.conversationId === conversationId);
    if (index > -1) conversations.value.splice(index, 1);
  }

  return {
    id,
    data,
    type,
    config,

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
    setEditor,
    getEditor,
    removeComments,
    restoreComments,
    removeConversation,
  }
}