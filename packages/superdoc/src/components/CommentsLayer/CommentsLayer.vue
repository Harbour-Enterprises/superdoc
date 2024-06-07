<script setup>
import { getCurrentInstance, computed, ref, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import useConversation from './use-conversation';
import useSelection from '@/helpers/use-selection';

const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();
const { COMMENT_EVENTS } = commentsStore;
const {
  documentsWithConverations,
  activeComment,
  floatingCommentsOffset,
  visibleConversations
} = storeToRefs(commentsStore);
const { documents } = storeToRefs(superdocStore);
const { proxy } = getCurrentInstance();

const emit = defineEmits(['highlight-click']);
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  parent: {
    type: Object,
    required: true,
  },
});

const addCommentEntry = (selection) => {
  const params = {
    creatorEmail: props.user.email,
    creatorName: props.user.name,
    documentId: selection.documentId,
    selection,
    isFocused: true,
  }

  const bounds = selection.selectionBounds;
  if (bounds.top > bounds.bottom) {
    const temp = bounds.top;
    bounds.top = bounds.bottom;
    bounds.bottom = temp;
  }

  if (bounds.left > bounds.right) {
    const temp = bounds.left;
    bounds.left = bounds.right;
    bounds.right = temp;
  }

  selection.selectionBounds = bounds;
  const matchedDocument = documents.value.find((c) => c.id === selection.documentId);
  const newConvo = useConversation(params);
  activeComment.value = newConvo.conversationId;


  matchedDocument.conversations.push(newConvo);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.NEW, newConvo.getValues());
}

const getStyle = (conversation) => {
  const { selection } = conversation
  const containerBounds = selection.getContainerLocation(props.parent)
  const placement = conversation.selection.selectionBounds;
  const top = parseFloat(placement.top) + containerBounds.top;
  return {
    position: 'absolute',
    top: top + 'px',
    left: placement.left + 'px',
    width: placement.right - placement.left + 'px',
    height: placement.bottom - placement.top + 'px',
  }
}

const setFloatingCommentOffset = (conversation, e) => {
  const floatingConvo = visibleConversations.value.find((c) => c.id === conversation.conversationId);
  const convoTop = conversation.selection.getContainerLocation(props.parent).top;

  const parentTop = props.parent.getBoundingClientRect().top;
  const top = floatingConvo.position.top;
  const eTop = e.target.getBoundingClientRect().top;

  floatingCommentsOffset.value = conversation.selection.selectionBounds.top; //top - eTop + parentTop;
}

const handleHighlightClick = (conversation, e) => {
  conversation.isFocused = true;
  activeComment.value = conversation.conversationId;
  setFloatingCommentOffset(conversation, e);
  emit('highlight-click', conversation);
}

const getAllConversations = computed(() => {
  return documentsWithConverations.value.reduce((acc, doc) => {
    return acc.concat(doc.conversations);
  }, []);
});

defineExpose({
  addCommentEntry
});

</script>

<template>
  <div class="comments-container" id="commentsContainer">
    <div class="comments-layer">
      <div
          :class="{ 'sd-highlight-active': activeComment === conversation.conversationId }"
          v-for="conversation in getAllConversations"
          class="comment-anchor sd-highlight"
          @click="(e) => handleHighlightClick(conversation, e)"
          :data-id="conversation.conversationId"
          :style="getStyle(conversation)"></div>
    </div>
  </div>
</template>

<style scoped>
.comment-doc {
  position: relative;
}
.comments-layer {
  position: relative;
}
.comment-anchor {
  position: absolute;
  cursor: pointer;
  z-index: 3;
  border-radius: 4px;
  transition: background-color 250ms ease;
}
.comments-container {
  /* pointer-events: none;  */
}
</style>