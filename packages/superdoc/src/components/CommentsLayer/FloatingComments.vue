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

/**
 * Floating comments layer
 * 
 * This component works by first sorting through all comments in order top-to-bottom
 * Then rendering each comment one at a time, checking for potential comment overlaps as each
 * new comment is added.
 */

let offset = 0;
const floatingCommentsContainer = ref(null);

const handleDialogReady = (dialogId, elementRef) => {
  // Called when a dialog has mounted
  // We must check for collisions against the previous dialog and adjust location if necessary

  const dialogIndex = sortedConversations.value.findIndex((c) => c.conversationId === dialogId);
  if (dialogIndex === -1 || dialogIndex >= sortedConversations.length - 1) return;

  // This is our current comment
  const dialog = visibleConversations.value[dialogIndex]
  if (!dialog) return;

 // Need to calculate the exact position of the dialog
  const selectionBounds = dialog.conversation.selection.getContainerLocation(props.parent)
  const position = elementRef.value.getBoundingClientRect();
  const selection = dialog.conversation.selection.selectionBounds;
  const top = parseFloat(selection.top) + selectionBounds.top;
  const left = parseFloat(selection.left) + position.left;
  dialog.position = {
    top,
    left,
    bottom: top + position.height,
    right: left + position.width,
  };

  // Check for collisions
  const resultingPosition = checkCollisions({ ...dialog.position }, dialogIndex);
  if (dialogIndex > 0) dialog.position = resultingPosition;

  // Render the next dialog
  nextTick(() => renderDialog(sortedConversations.value[dialogIndex + 1]));
}

const checkCollisions = (proposedPosition, dialogIndex) => {
  // Checks for collisions between the current dialog position and the previous one 
  // Important: this only works if the list is sorted to begin with

  const updatedPosition = { ...proposedPosition };
  if (dialogIndex === 0) return updatedPosition;

  const currentItem = visibleConversations.value[dialogIndex];
  const previousItem = visibleConversations.value[dialogIndex - 1];
  const previousPosition = previousItem.position;
  const topComparison = proposedPosition.top < previousPosition.bottom;

  // If we have a collision, adjust the top and bottom positions
  if (topComparison) {
    const height = proposedPosition.bottom - proposedPosition.top;
    const newTop = previousPosition.bottom + 5;
    currentItem.offset = newTop - proposedPosition.top;
    updatedPosition.top = newTop;
    updatedPosition.bottom = updatedPosition.top + height;
  }

  if (currentItem.id === activeComment.value) {
    floatingCommentsOffset.value += currentItem.offset;
    offset = updatedPosition.top;
    
    const diff = updatedPosition.top - proposedPosition.top;
    floatingCommentsOffset.value += diff;
  }
  return updatedPosition
}

const renderDialog = (data) => {
  if (!data) return;
  const nextConvo = useFloatingConverasation(data);
  visibleConversations.value.push(nextConvo);
}

const sortByLocation = (a, b) => {
  // Sort comments by page and by position first

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
}

const getCommentPosition = (convo) => {
  return {
    top: convo.position.top + 'px',
  }
}

const getFloatingSidebarStyle = computed(() => {
  return {
    marginTop: floatingCommentsOffset.value * (-1/2) + 'px',
  }
})

// Update the floating comments when the conversations change
watch(documentsWithConverations, (newVal) => (newVal.length && initialize()));
watch(activeComment, (newVal) => {
  setTimeout(() => {
    if (!activeComment.value) {
      floatingCommentsOffset.value = 0;
      initialize();
    }
  })
});
onMounted(() => {
  initialize();
});

</script>

<template>
  <div class="section-wrapper" v-if="visibleConversations.length" ref="floatingCommentsContainer">
    <div :style="getFloatingSidebarStyle" class="sidebar-container">
      <div v-for="floatingConversation in visibleConversations">
        <CommentDialog
              class="floating-comment"
              @ready="handleDialogReady"
              @dialog-exit="initialize"
              :style="getCommentPosition(floatingConversation)"
              :data="floatingConversation.conversation"
              :current-document="currentDocument"
              :user="user" />
        </div>
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