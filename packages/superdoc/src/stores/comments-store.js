import { defineStore } from 'pinia';
import { ref, reactive, computed, unref } from 'vue';
import { comments_module_events } from '@harbour-enterprises/common';
import { useSuperdocStore } from '@/stores/superdoc-store';
import { syncCommentsToClients } from '../core/collaboration/helpers.js';
import { Editor, } from '@harbour-enterprises/super-editor';
import { getRichTextExtensions } from '@harbour-enterprises/super-editor';
import useComment from '@/components/CommentsLayer/use-comment';

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
  const suppressInternalExternal = ref(true);
  const currentCommentText = ref('');
  const commentsList = ref([]);
  const isCommentsListVisible = ref(false);

  // Floating comments
  const floatingCommentsOffset = ref(0);
  const sortedConversations = ref([]);
  const visibleConversations = ref([]);
  const skipSelectionUpdate = ref(false);

  const pendingComment = ref(null);

  /**
   * Initialize the store
   * 
   * @param {Object} config The comments module config from SuperDoc
   * @returns {void}
   */
  const init = (config = {}) => {
    const updatedConfig = {...commentsConfig, ...config};
    Object.assign(commentsConfig, updatedConfig);
  
    suppressInternalExternal.value = commentsConfig.suppressInternalExternal || false;

    // Map initial comments state
    if (config.comments && config.comments.length) {
      commentsList.value = config.comments?.map((c) => useComment(c)) || [];
    };
  };

  const showAddComment = (superdoc) => {    
    const selection = { ...superdocStore.activeSelection };
    selection.selectionBounds = { ...selection.selectionBounds };

    if (superdocStore.selectionPosition?.source) {
      superdocStore.selectionPosition.source = null;
    };

    pendingComment.value = getPendingComment({ selection, documentId: selection.documentId, parentCommentId: null });

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
    return commentsConfig;
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

  // const addConversation = (activeDocument, initialComment) => {
  //   console.log('addConversation', activeDocument, initialComment);
  //   const newConversation = { ...pendingComment.value };
  //   commentsByDocument[activeDocument.id] = [];
  //   commentsByDocument[activeDocument.id].push(newConversation);

  //   //   const parentBounds = props.parent.getBoundingClientRect();

  //   //   const selection = pendingComment.value.selection.getValues();
  //   //   selection.selectionBounds.top = selection.selectionBounds.top; // - parentBounds.top;
  //   //   selection.selectionBounds.bottom = selection.selectionBounds.bottom; // - parentBounds.top;

  //   //   const bounds = selection.selectionBounds;
  //   //   if (bounds.top > bounds.bottom) {
  //   //     const temp = bounds.top;
  //   //     bounds.top = bounds.bottom;
  //   //     bounds.bottom = temp;
  //   //   }
  //   //   if (bounds.left > bounds.right) {
  //   //     const temp = bounds.left;
  //   //     bounds.left = bounds.right;
  //   //     bounds.right = temp;
  //   //   }
  //   //   newConversation.selection = useSelection(selection);
  //   //   newConversation.comments.push(comment);
    
  //   console.debug('activeDocument', activeDocument.conversations.length, newConversation);
  //   activeDocument.conversations.push(newConversation);
  //   console.debug('activeDocument after', activeDocument.conversations.length);
  // };

  /**
   * Get a new pending comment
   * 
   * @param {Object} param0 
   * @param {Object} param0.selection The selection object
   * @param {String} param0.documentId The document ID
   * @param {String} param0.parentCommentId The parent comment
   * @returns {Object} The new comment object
   */
  const getPendingComment = ({ selection, documentId, parentCommentId, ...options }) => {
    return _getNewcomment({ selection, documentId, parentCommentId, ...options });
  };

  /**
   * Get the new comment object
   * 
   * @param {Object} param0 
   * @param {Object} param0.selection The selection object
   * @param {String} param0.documentId The document ID
   * @param {String} param0.parentCommentId The parent comment ID
   * @returns {Object} The new comment object
   */
  const _getNewcomment = ({ selection, documentId, parentCommentId, ...options }) => {
    let activeDocument;
    if (documentId) activeDocument = superdocStore.getDocument(documentId);
    else if (selection) activeDocument = superdocStore.getDocument(selection.documentId);

    return useComment({
      ...options,
      fileId: activeDocument.id,
      fileType: activeDocument.type,
      parentCommentId,
      creatorEmail: superdocStore.user.email,
      creatorName: superdocStore.user.name,
      commentText: currentCommentText.value,
      selection,
   });
  };

  /**
   * Remove the pending comment
   * 
   * @returns {void}
   */
  const removePendingComment = () => {
    currentCommentText.value = '';
    pendingComment.value = null;
    activeComment.value = null;
  };

  /**
   * Add a new comment to the document
   * 
   * @param {Object} param0 
   * @param {Object} param0.superdoc The SuperDoc instance
   * @returns {void}
   */
  const addComment = ({ superdoc, comment }) => {    
    let parentComment = commentsList.value.find((c) => c.commentId === activeComment.value);
    if (!parentComment) parentComment = comment;
  
    const newComment = useComment(comment.getValues());
    newComment.setText({ text: currentCommentText.value, suppressUpdate: true });

    // Add the new comments to our global list
    commentsList.value.push(newComment);

    // If collaboration is enabled, sync the comments to all clients
    syncCommentsToClients(superdoc);

    // Clean up the pending comment
    removePendingComment();

    // Emit event for end users
    superdoc.emit('comments-update', { type: COMMENT_EVENTS.ADD, comment: newComment.getValues() });

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

  const deleteComment = ({ commentId: commentIdToDelete, superdoc }) => {
    const commentIndex = commentsList.value.findIndex((c) => c.commentId === commentIdToDelete);
    const comment = commentsList.value[commentIndex];
    const { commentId } = comment;
    const { fileId } = comment;

    commentsList.value.splice(commentIndex, 1);

    const emitData = {
      type: COMMENT_EVENTS.DELETED,
      comment: comment.getValues(),
      changes: [{ key: 'deleted', commentId, fileId }],
    };
    superdoc.emit('comments-update', emitData);
    syncCommentsToClients(superdoc);
  }

  /**
   * Cancel the pending comment
   * 
   * @returns {void}
   */
  const cancelComment = () => {
    removePendingComment();
  }

  /**
   * Initialize loaded comments into SuperDoc by mapping the imported 
   * comment data to SuperDoc useComment objects.
   * 
   * Updates the commentsList ref with the new comments.
   * 
   * @param {Object} param0 
   * @param {Array} param0.comments The comments to be loaded
   * @param {String} param0.documentId The document ID
   * @returns {void}
   */
  const processLoadedDocxComments = ({ comments, documentId }) => {
    const document = superdocStore.getDocument(documentId);
    comments.forEach((comment) => {
      const importedName = `${comment.creatorName} (imported)`;
      const newComment = useComment({
        fileId: documentId,
        fileType: document.type,
        commentId: comment.id,
        parentCommentId: comment.parentCommentId,
        creatorEmail: comment.creatorEmail,
        creatorName: `${comment.creatorName} (imported)`,
        commentText: getHTmlFromComment(comment.textJson),
        resolvedTime: comment.isDone ? Date.now() : null,
        resolvedByEmail: comment.isDone ? comment.creatorEmail : null,
        resolvedByName: comment.isDone ? importedName : null,
      });
      commentsList.value.push(newComment);
    });
  }

  const prepareCommentsForExport = () => {
    const processedComments = []
    commentsList.value.forEach((comment) => {
      const values = comment.getValues();
      const richText = values.commentText;
      const schema = convertHtmlToSchema(richText);
      processedComments.push({
        ...values,
        commentJSON: schema,
      });
    });
    return processedComments;
  };

  const convertHtmlToSchema = (commentHTML) => {
    const div = document.createElement('div');
    div.innerHTML = commentHTML;
    const editor = new Editor({
      mode: 'text',
      isHeadless: true,
      content: div,
      extensions: getRichTextExtensions(),
    });
    return editor.getJSON().content[0];
  };

  /**
   * Get HTML content from the comment text JSON (which uses DOCX schema)
   * 
   * @param {Object} commentTextJson The comment text JSON
   * @returns {string} The HTML content
   */
  const getHTmlFromComment = (commentTextJson) => {
    const editor = new Editor({
      mode: 'text',
      isHeadless: true,
      content: commentTextJson,
      loadFromSchema: true,
      extensions: getRichTextExtensions(),
    });
    return editor.getHTML();
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
    commentsList,
    isCommentsListVisible,

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
    init,
    getCommentLocation,
    hasOverlapId,
    checkOverlaps,
    initialCheck,
    getPendingComment,
    showAddComment,
    addComment,
    cancelComment,
    deleteComment,
    removePendingComment,
    processLoadedDocxComments,
    prepareCommentsForExport,
  };
});
