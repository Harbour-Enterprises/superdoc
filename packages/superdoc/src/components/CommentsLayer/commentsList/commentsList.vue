<script setup>
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import CommentDialog from '../CommentDialog.vue';

const props = defineProps({
  showMainComments: {
    type: Boolean,
    default: true,
  },
  showResolvedComments: {
    type: Boolean,
    default: true,
  },
});

const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();
const { commentsList } = storeToRefs(commentsStore);

/**
 * Generate the comments list separating resolved and active
 * We only return parent comments here, since CommentDialog.vue will handle threaded comments
 */
const comments = computed(() => {
  const parentComments = [];
  const resolvedComments = [];
  const childCommentMap = new Map();

  commentsList.value.forEach((comment) => {
    // Track resolved comments
    if (comment.resolvedTime) {
      resolvedComments.push(comment);
    }

    // Track parent comments
    else if (!comment.parentCommentId && !comment.resolvedTime) {
      parentComments.push({ ...comment });
    }

    // Track child comments (threaded comments)
    else if (comment.parentCommentId) {
      if (!childCommentMap.has(comment.parentCommentId)) {
        childCommentMap.set(comment.parentCommentId, []);
      }
      childCommentMap.get(comment.parentCommentId).push(comment);
    }
  });

  // Return only parent comments
  const sortedParentComments = parentComments.sort((a, b) => a.createdTime - b.createdTime);
  const sortedResolvedComments = resolvedComments.sort((a, b) => a.createdTime - b.createdTime);

  return {
    parentComments: sortedParentComments,
    resolvedComments: sortedResolvedComments,
  };
});

onMounted(() => {
  commentsStore.isCommentsListVisible = true;
});

onBeforeUnmount(() => {
  commentsStore.isCommentsListVisible = false;
});
</script>

<template>
  <div class="comments-list">
    <div v-if="showMainComments">
      <div v-for="comment in comments.parentComments" class="comment-item">
        <CommentDialog :comment="comment" />
      </div>
    </div>

    <div v-if="showResolvedComments">
      <div class="comment-title">Resolved</div>
      <div v-for="comment in comments.resolvedComments" class="comment-item">
        <CommentDialog :comment="comment" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 400px;
}
.comment-item {
  margin-bottom: 10px;
}
.comment-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}
</style>
