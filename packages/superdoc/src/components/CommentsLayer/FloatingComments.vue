<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref, reactive, computed, watch, nextTick } from 'vue';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import useFloatingConverasation from './use-floating-conversation';
import CommentDialog from '@/components/CommentsLayer/CommentDialog.vue';

const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();
const {
  documentsWithConverations,
  floatingCommentsOffset,
  visibleConversations,
  sortedConversations,
  activeComment
} = storeToRefs(commentsStore);
const { user } = storeToRefs(superdocStore);

const props = defineProps({
  currentDocument: {
    type: Object,
    required: true,
  },
  parent: {
    type: Object,
    required: true,
  },
});

const floatingCommentsContainer = ref(null);
const handleDialogReady = (dialogId, elementRef) => {
  const dialogIndex = sortedConversations.value.findIndex((c) => c.conversationId === dialogId);
  if (dialogIndex === -1 || dialogIndex >= sortedConversations.length - 1) return;

  const dialog = visibleConversations.value[dialogIndex]
  if (!dialog) return;

  const containerBounds = floatingCommentsContainer.value.getBoundingClientRect();
  const selectionBounds = dialog.conversation.selection.getContainerLocation(props.parent)
  const position = elementRef.value.getBoundingClientRect();
  const selection = dialog.conversation.selection.selectionBounds;
  const top = selection.top + position.top + selectionBounds.top - containerBounds.top;
  const left = selection.left + position.left;
  dialog.position = {
    top,
    left,
    bottom: top + position.height,
    right: left + position.width,
  };

  const resultingPosition = checkCollisions({ ...dialog.position }, dialogIndex);
  if (dialogIndex > 0) dialog.position = resultingPosition;

  nextTick(() => renderDialog(sortedConversations.value[dialogIndex + 1]));
}

const checkCollisions = (proposedPosition, dialogIndex) => {
  const updatedPosition = { ...proposedPosition };
  if (dialogIndex === 0) return updatedPosition;

  const currentItem = visibleConversations.value[dialogIndex];
  const previousItem = visibleConversations.value[dialogIndex - 1];
  const previousPosition = previousItem.position;
  const topComparison = proposedPosition.top < previousPosition.bottom;

  if (topComparison) {
    const height = proposedPosition.bottom - proposedPosition.top;
    const newTop = previousPosition.bottom + 2;
    currentItem.offset = newTop - proposedPosition.top;
    updatedPosition.top = newTop;
    updatedPosition.bottom = updatedPosition.top + height;
  }

  if (currentItem.id === activeComment.value) {
    floatingCommentsOffset.value += currentItem.offset;
  }
  return updatedPosition
}

const renderDialog = (data) => {
  if (!data) return;

  const nextConvo = useFloatingConverasation(data);
  visibleConversations.value.push(nextConvo);
}

const sortByLocation = (a, b) => {
  const pageA = a.selection.page;
  const pageB = b.selection.page;
  if (pageA !== pageB) return pageA - pageB;

  const topB = b.selection.selectionBounds.top;
  const topA = a.selection.selectionBounds.top;
  return topA - topB;
}

const initialize = () => {
  visibleConversations.value = [];
  nextTick(() => initializeConvos());
}

const initializeConvos = () => {
  const firstDoc = documentsWithConverations.value[0];
  const conversations = [...firstDoc.conversations];
  sortedConversations.value = conversations.sort(sortByLocation);
  visibleConversations.value.push(useFloatingConverasation(sortedConversations.value[0]));

  if (!activeComment.value) floatingCommentsOffset.value = 0;
}

const getPosition = (convo) => {
  return {
    top: convo.position.top + 'px',
  }
}

const getFloatingSidebarStyle = computed(() => {
  return {
    marginTop: floatingCommentsOffset.value * (-1/2) + 'px',
  }
})

watch(documentsWithConverations, (newVal) => {
  if (!newVal.length) return;
  initialize();
})

onMounted(() => {
  initialize();
});
</script>

<template>
  <div class="section-wrapper" v-if="visibleConversations.length" ref="floatingCommentsContainer">
    <div :style="getFloatingSidebarStyle" class="sidebar-container">
      <CommentDialog
            class="floating-comment"
            v-for="floatingConversation in visibleConversations"
            @ready="handleDialogReady"
            @dialog-exit="initialize"
            :style="getPosition(floatingConversation)"
            :data="floatingConversation.conversation"
            :current-document="currentDocument"
            :user="user" />
    </div>
  </div>
</template>

<style scoped>
.section-wrapper {
  position: relative;
  min-height: 100%;
  width: 300px;
}
.floating-comment {
  position: absolute;
  min-width: 300px;
}
</style>