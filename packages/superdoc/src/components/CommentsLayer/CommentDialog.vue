<script setup>
import { computed, toRefs, ref, getCurrentInstance, onMounted, nextTick } from 'vue';
import { NDropdown, NTooltip, NSelect } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import { SuperInput } from '@harbour-enterprises/super-editor';
import { superdocIcons } from '@/icons.js';
import useSelection from '@/helpers/use-selection';
import useComment from '@/components/CommentsLayer/use-comment';
import Avatar from '@/components/general/Avatar.vue';
import InternalDropdown from './InternalDropdown.vue';
import CommentHeader from './CommentHeader.vue';
import CommentInput from './CommentInput.vue';

const emit = defineEmits(['click-outside', 'ready', 'dialog-exit']);
const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  autoFocus: {
    type: Boolean,
    default: false,
  },
});

const { proxy } = getCurrentInstance();
const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();

/* Comments store refs */
const { addComment, cancelComment, deleteComment, removePendingComment, } = commentsStore;
const {
  suppressInternalExternal,
  getConfig,
  activeComment,
  floatingCommentsOffset,
  pendingComment,
  currentCommentText,
} = storeToRefs(commentsStore);

const isInternal = ref(true);
const isEditing = ref(false);
const isFocused = ref(false);
const commentInput = ref(null);

const isActiveComment = computed(() => activeComment.value === props.comment.commentId);
const showButtons = computed(() => {
  return !getConfig.readOnly
    && isActiveComment.value
    && !props.comment.resolvedTime
    && !isEditing.value;
});

const showSeparator = computed(() => (index) => {
  if (showInputSection.value && index === comments.value.length - 1) return true;
  return comments.value.length > 1
    && index !== comments.value.length - 1
});

const showInputSection = computed(() => {
  return !getConfig.readOnly
    && isActiveComment.value
    && !props.comment.resolvedTime
    && !isEditing.value;
});

const comments = computed(() => {
  const parentComment = props.comment;
  return commentsStore.commentsList
    .filter((c) => {
      const isThreadedComment = c.parentCommentId === parentComment.commentId;
      const isThisComment = c.commentId === props.comment.commentId;
      return isThreadedComment || isThisComment;
    })
    .sort((a, b) => a.commentId === props.comment.commetnId && a.createdTime - b.createdTime);
});

const getCommentUser = computed(() => (comment) => {
  return {
    name: comment.creatorName,
    email: comment.creatorEmail,
  };
});

const allowResolve = computed(() => (comment) => {
  const isAllowOverride = getConfig.value.allowResolveOverride;
  if (isAllowOverride) return true;

  const allowedInConfig = getConfig.value.allowResolve;
  const isParentCommentUser = comment.creatorEmail === superdocStore.user.email;
  const isResolved = comment.resolvedTime;
  const isParentComment = !comment.parentCommentId;
  return allowedInConfig
    && (isParentCommentUser || !comment.creatorEmail)
    && isParentComment
    && !isResolved;
});

const isInternalDropdownDisabled = computed(() => {
  if (props.comment.resolvedTime) return true;
  return getConfig.value.readOnly;
});

const overflowOptions = [
  { label: 'Edit', key: 'edit' },
  { label: 'Delete', key: 'delete' },
];

const showOverflow = computed(() => (comment) => {
  if (!!props.comment.resolvedTime) return [];

  // If this comment belongs to the current user, allow edit, delete
  if (comment.creatorEmail === superdocStore.user.email) {
    return overflowOptions;
  };

  // Allow no overflow if the comment does not belong to the current user
  return [];
});

const isEditingThisComment = computed(() => (comment) => {
  return isEditing.value === comment.commentId;
});

const setFocus = () => {
  activeComment.value = props.comment.commentId;
};

const handleClickOutside = (e) => {
  if (e.target.classList.contains('n-dropdown-option-body__label')) return;
  if (activeComment.value === props.comment.commentId) {
    floatingCommentsOffset.value = 0;

    emit('dialog-exit');
    if (e.target.dataset.id) activeComment.value = e.target.dataset.id;
    else if (!e.target.dataset.threadId) activeComment.value = null;
  };
};

const handleAddComment = () => {
  const options = {
    documentId: props.comment.fileId,
    parentCommentId: pendingComment.value ? null : props.comment.commentId,
  };

  const comment = commentsStore.getPendingComment(options);
  addComment({ superdoc: proxy.$superdoc, comment })
};

const handleResolve = () => {
  props.comment.resolveComment({
    email: superdocStore.user.email,
    name: superdocStore.user.name,
    superdoc: proxy.$superdoc,
  });
};

const handleOverflowSelect = (value, comment) => {
  switch (value) {
    case 'edit':
      currentCommentText.value = comment.commentText;
      isEditing.value = comment.commentId;
      break;
    case 'delete':
      deleteComment({ superdoc: proxy.$superdoc, commentId: comment.commentId });
      break;
  };
};

const handleCommentUpdate = (comment) => {
  isEditing.value = null;
  comment.setText({ text: currentCommentText.value, superdoc: proxy.$superdoc });
  removePendingComment();
}

const handleInternalExternalSelect = (value) => {
  const isInternal = value.toLowerCase() === 'internal';
  props.comment.setIsInternal({ isInternal: isInternal, superdoc: proxy.$superdoc });
};


onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => setFocus());
  };
})
</script>

<template>
  <div
    class="comments-dialog"
    :class="{ 'is-active': isActiveComment, 'is-resolved': props.comment.resolvedTime }"
    v-click-outside="handleClickOutside"
    @click.stop.prevent="setFocus"
  >

    <div v-if="!suppressInternalExternal" class="existing-internal-input">
      <InternalDropdown
        class="internal-dropdown"
        :is-disabled="isInternalDropdownDisabled"
        :state="comment.isInternal ? 'internal' : 'external'"
        @select="handleInternalExternalSelect"
      />
    </div>

    <!-- Comments and their threaded (sub) comments are rendered here -->
    <div v-for="(comment, index) in comments" :key="index" class="conversation-item">
      <CommentHeader
        :user="getCommentUser(comment)"
        :config="getConfig"
        :timestamp="comment.createdTime"
        :allow-resolve="allowResolve(comment)"
        :overflow-options="showOverflow(comment)"
        @resolve="handleResolve"
        @overflow-select="handleOverflowSelect($event, comment)"
      />

      <!-- Show the comment text, unless we enter edit mode, then show an input and update buttons -->
      <div class="card-section comment-body">
        <div v-if="!isEditingThisComment(comment)" class="comment" v-html="comment.commentText"></div>
        <div v-else class="comment-editing">
          <CommentInput
            :user="superdocStore.user"
            :users="proxy.$superdoc.users"
            :config="getConfig"
            :include-header="false"
          />
          <div class="comment-footer">
            <button class="sd-button" @click.stop.prevent="cancelComment">Cancel</button>
            <button
              class="sd-button primary"
              @click.stop.prevent="handleCommentUpdate(comment)"
              >
                Update
              </button>
          </div>
        </div>
      </div>
      <div class="comment-separator" v-if="showSeparator(index)"></div>
    </div>
  
    <!-- This area is appended to a comment if adding a new sub comment -->
    <div v-if="showInputSection && !getConfig.readOnly">
      <CommentInput
        ref="commentInput"
        :user="superdocStore.user"
        :users="proxy.$superdoc.users"
        :config="getConfig"
      />

      <div class="comment-footer" v-if="showButtons && !getConfig.readOnly">
        <button class="sd-button" @click.stop.prevent="cancelComment">Cancel</button>
        <button class="sd-button primary" @click.stop.prevent="handleAddComment">Comment</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.change-type {
  font-style: italic;
  font-weight: 600;
}
.comment-separator {
  background-color: #dbdbdb;
  height: 1px;
  width: 100%;
  margin: 10px 0;
}
.existing-internal-input {
  margin-bottom: 10px;
}
.initial-internal-dropdown {
  margin-top: 10px;
}
.comments-dialog {
  display: flex;
  flex-direction: column;
  padding: 10px 15px;
  border-radius: 12px;
  background-color: #f3f6fd;
  transition: background-color 250ms ease;
  -webkit-box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  -moz-box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  box-shadow: 0px 4px 12px 0px rgba(50, 50, 50, 0.15);
  z-index: 5;
  width: 300px;
}
.is-active {
  z-index: 10;
}
.input-section {
  margin-top: 10px;
}
.sd-button {
  font-size: 12px;
  margin-left: 5px;
}
.comment {
  font-size: 13px;
  margin: 10px 0;
}
.is-resolved {
  background-color: #f0f0f0;
}
.comment-footer {
  margin: 5px 0 5px;
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.internal-dropdown {
  display: inline-block;
}

.comment-editing {
  padding-bottom: 10px;
}
.comment-editing button {
  margin-left: 5px;
}
.tracked-change {
  margin: 0;
}
</style>
