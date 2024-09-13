import { ref, reactive, toRaw } from 'vue';

export default function useComment(params) {
  const id = ref(params.id);
  const comment = ref(params.comment);
  const trackedChange = ref(params.trackedChange);
  const user = reactive({
    name: params.user.name,
    email: params.user.email,
  });
  const timestamp = new Date(params.timestamp || Date.now());

  const getValues = () => {
    return {
      comment: comment.value,
      user: toRaw(user),
      timestamp,
    }
  }
  return {
    id,
    comment,
    trackedChange,
    user,
    timestamp,
    getValues,
  }
}