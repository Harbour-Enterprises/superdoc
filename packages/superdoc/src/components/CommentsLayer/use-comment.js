import { ref, reactive, toRaw } from 'vue';

export default function useComment(params) {
  const id = ref(params.id || crypto.randomUUID());
  const documentId = ref(params.documentId);
  const comment = ref(params.comment);
  const trackedChange = ref(params.trackedChange);
  const user = reactive({
    name: params.user.name,
    email: params.user.email,
  });

  const timestamp = new Date(params.timestamp || Date.now());

  const getValues = () => {
    return {
      id: id.value,
      documentId: documentId.value,
      comment: comment.value,
      trackedChange: toRaw(trackedChange),
      user: toRaw(user),
      timestamp: new Date(timestamp).getTime(),
    };
  };

  return {
    id,
    documentId,
    comment,
    trackedChange,
    user,
    timestamp,
    getValues,
  };
};
