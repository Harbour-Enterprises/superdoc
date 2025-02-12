import { defineStore } from 'pinia';
import { ref, reactive, computed, unref } from 'vue';
import { comments_module_events } from '@harbour-enterprises/common';
import { useSuperdocStore } from '@/stores/superdoc-store';
import { syncCommentsToClients } from '../core/collaboration/helpers.js';
import useComment from '@/components/CommentsLayer/use-comment';
import useConversation from '../components/CommentsLayer/use-conversation';

export const useCommentsStore = defineStore('comments', () => {
  const superdocStore = useSuperdocStore();
  const commentsConfig = reactive({
    name: 'comments',
    readOnly: false,
    allowResolve: true,
    showResolved: false,
  });

  const COMMENT_EVENTS = comments_module_events;
  const hasInitializedComments = ref(false);
  const activeComment = ref(null);
  const commentDialogs = ref([]);
  const overlappingComments = ref([]);
  const overlappedIds = new Set([]);
  const suppressInternalExternal = ref(false);
  const currentCommentText = ref('');

  // Floating comments
  const floatingCommentsOffset = ref(0);
  const sortedConversations = ref([]);
  const visibleConversations = ref([]);
  const skipSelectionUpdate = ref(false);

  const pendingComment = ref(null);
  const getPendingComment = (selection) => {
    return useConversation({
      documentId: selection.documentId,
      creatorEmail: superdocStore.user.email,
      creatorName: superdocStore.user.name,
      comments: [],
      selection,
    });
  };

  const showAddComment = () => {
  
    // Need to fully unref the selection before applying it to the new object
    const selection = { ...superdocStore.activeSelection };
    selection.selectionBounds = { ...selection.selectionBounds };

    superdocStore.selectionPosition.source = null;
    pendingComment.value = getPendingComment(selection);

    if (pendingComment.value.selection.source === 'super-editor') {
      superdocStore.selectionPosition.source = 'super-editor';
    }
    activeComment.value = pendingComment.value.conversationId;
  };

  const hasOverlapId = (id) => overlappedIds.includes(id);
  const documentsWithConverations = computed(() => {
    return superdocStore.documents?.filter((d) => d.conversations.length > 0) || [];
  });

  const getConfig = computed(() => {
    return {
      ...commentsConfig,
      ...superdocStore.modules?.comments,
    };
  });

  const getCommentLocation = (selection, parent) => {
    const containerBounds = selection.getContainerLocation(parent);
    const top = containerBounds.top + selection.selectionBounds.top;
    const left = containerBounds.left + selection.selectionBounds.left;
    return {
      top: top,
      left: left,
    };
  };

  function isOverlap(obj1, obj2) {
    if (!obj1.comments.length || !obj2.comments.length) return false;
    const sel1 = obj1.selection.selectionBounds;
    const sel2 = obj2.selection.selectionBounds;

    if (sel1.bottom - sel2.top < 200 || sel2.top - sel1.bottom < 200) return true;
    return false;
  }

  const getAllConversations = computed(() => {
    const allConvos = [];
    let overlaps = 0;
    documentsWithConverations.value.map((doc) => {
      doc.conversations.forEach((c) => {
        for (let index in allConvos) {
          const conv = allConvos[index];
          let currentOverlap = conv.overlap || overlaps;

          if (isOverlap(conv, c)) {
            conv.overlap = currentOverlap;
            c.overlap = currentOverlap;
            overlaps++;
          }
        }

        allConvos.push({
          ...c,
          documentId: doc.documentId,
          doc: doc,
        });
      });
    });
    return allConvos;
  });

  const getAllConversationsFiltered = computed(() => {
    return getAllConversations.value.filter((c) => !c.group).filter((c) => !c.markedDone);
  });

  const getAllGroups = computed(() => {
    return getAllConversations.value.filter((c) => c.group);
  });

  const initialCheck = () => {
    const currentDialogs = document.querySelectorAll('.comment-box');
    currentDialogs.forEach((d) => {
      const conversationObject = getAllConversations.value.find((conversation) => {
        return conversation.conversationId === d.dataset.id;
      });
      if (!conversationObject) return;
      checkOverlaps(d, conversationObject);
    });
  };

  const checkOverlaps = (currentElement, dialog, doc) => {
    const currentDialogs = document.querySelectorAll('.comment-box');
    const currentBounds = currentElement.getBoundingClientRect();

    const overlaps = [];
    currentDialogs.forEach((d) => {
      if (d.dataset.id === dialog.conversationId) return;
      const bounds = d.getBoundingClientRect();

      if (Math.abs(bounds.top - currentBounds.top) < 50 || Math.abs(bounds.bottom - currentBounds.bottom) < 50) {
        if (!d.dataset?.id) {
          // Then this is a group
          const groupIndex = d.dataset.index;
          const group = overlappingComments.value[groupIndex];
          group?.unshift(dialog);
        } else {
          let dialogObject = dialog.doc?.conversations?.find((c) => c.conversationId === d.dataset.id);
          if (!dialogObject) dialogObject = doc.conversations.find((c) => c.conversationId === d.dataset.id);
          overlaps.unshift(dialogObject);
          overlaps.unshift(dialog);
          dialogObject.group = true;
        }
        dialog.group = true;
      }
    });
    if (overlaps.length) {
      const overlapsGroup = overlappingComments.value.find((group) => {
        return group.some((c) => c.conversationId === dialog.conversationId);
      });

      if (overlapsGroup) {
        const filtered = overlaps.filter((o) => !overlapsGroup.some((o) => o.conversationId === o.conversationId));
        overlapsGroup.push(...filtered);
      } else {
        overlappingComments.value.unshift(overlaps);
      }
    }
  };

  const addConversation = (activeDocument, initialComment) => {
    console.log('addConversation', activeDocument, initialComment);
    const newConversation = { ...pendingComment.value };
    commentsByDocument[activeDocument.id] = [];
    commentsByDocument[activeDocument.id].push(newConversation);

    //   const parentBounds = props.parent.getBoundingClientRect();

    //   const selection = pendingComment.value.selection.getValues();
    //   selection.selectionBounds.top = selection.selectionBounds.top; // - parentBounds.top;
    //   selection.selectionBounds.bottom = selection.selectionBounds.bottom; // - parentBounds.top;

    //   const bounds = selection.selectionBounds;
    //   if (bounds.top > bounds.bottom) {
    //     const temp = bounds.top;
    //     bounds.top = bounds.bottom;
    //     bounds.bottom = temp;
    //   }
    //   if (bounds.left > bounds.right) {
    //     const temp = bounds.left;
    //     bounds.left = bounds.right;
    //     bounds.right = temp;
    //   }
    //   newConversation.selection = useSelection(selection);
    //   newConversation.comments.push(comment);
    
    console.debug('activeDocument', activeDocument.conversations.length, newConversation);
    activeDocument.conversations.push(newConversation);
    console.debug('activeDocument after', activeDocument.conversations.length);
  };

  const _getNewcomment = (activeDocument) => {
    return useComment({
      documentId: activeDocument.id,
      user: {
        email: superdocStore.user.email,
        name: superdocStore.user.name,
      },
      timestamp: new Date(),
      comment: currentCommentText.value,
    });
  };

  const removePendingComment = () => {
    currentCommentText.value = '';
    pendingComment.value = null;
  };

  const addComment = (activeDocument, proxy) => {
    // Get the current conversation, if it exists
    let conversation = activeDocument.conversations.find((c) => c.conversationId === activeComment.value);

    // If this conversation is pending addition, add to the document first
    if (!!pendingComment.value && !conversation) {
      conversation = { ...pendingComment.value };
      activeDocument.conversations.push(conversation);
    }

    const newComment = _getNewcomment(activeDocument);
    conversation.comments.push(newComment);
    syncCommentsToClients(proxy.$superdoc);
    removePendingComment();

    //   // Suppress click if the selection was made by the super-editor
    //   newConversation.suppressClick = isSuppressClick(pendingComment.value.selection);
    //   newConversation.thread = newConversation.conversationId;

    //   // Remove the pending comment
    //   removePendingComment();
    //   skipSelectionUpdate.value = true;

    //   const editor = proxy.$superdoc.activeEditor;
    //   if (editor) {
    //     createNewEditorComment({ conversation: newConversation, editor });
    //     newConversation.suppressHighlight = true;
    //   };

    //   newConversation.isInternal = isInternal.value;
    //   // props.currentDocument.conversations.push(newConversation);


    // } else {
    //   // props.data.comments.push(comment);
    //   // proxy.$superdoc.broadcastComments(COMMENT_EVENTS.ADD, props.data.getValues());
    // }

    // currentComment.value = '';
    // emit('dialog-exit');
    // activeComment.value = null;
  };

  return {
    COMMENT_EVENTS,
    hasInitializedComments,
    activeComment,
    commentDialogs,
    overlappingComments,
    overlappedIds,
    suppressInternalExternal,
    pendingComment,
    currentCommentText,

    // Floating comments
    floatingCommentsOffset,
    sortedConversations,
    visibleConversations,
    skipSelectionUpdate,

    // Getters
    getConfig,
    documentsWithConverations,
    getAllConversations,
    getAllConversationsFiltered,
    getAllGroups,

    // Actions
    getCommentLocation,
    hasOverlapId,
    checkOverlaps,
    initialCheck,
    getPendingComment,
    showAddComment,
    addComment,
  };
});
