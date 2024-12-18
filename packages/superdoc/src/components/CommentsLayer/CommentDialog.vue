<script setup>
import { computed, toRefs, ref, getCurrentInstance, onMounted } from 'vue';
import { NDropdown, NTooltip, NSelect } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import { SuperInput } from '@harbour-enterprises/super-editor';
import useSelection from '@/helpers/use-selection';
import useComment from '@/components/CommentsLayer/use-comment';
import Avatar from '@/components/general/Avatar.vue';
import InternalDropdown from './InternalDropdown.vue'
import falCheckIcon from '@/assets/fontawesome/light/check.svg?raw';

const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();
const { COMMENT_EVENTS } = commentsStore;
const { getConfig, activeComment, pendingComment, floatingCommentsOffset, suppressInternalExternal, skipSelectionUpdate } = storeToRefs(commentsStore);
const { areDocumentsReady, getDocument } = superdocStore;
const { selectionPosition, activeZoom, documentScroll } = storeToRefs(superdocStore);
const { proxy } = getCurrentInstance();

const props = defineProps({
  user: {
    type: Object,
    required: false,
  },
  users: {
    type: Array,
    required: false,
  },
  data: {
    type: Object,
    required: true,
  },
  parent: {
    type: Object,
    required: false,
  },
  currentDocument: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click-outside', 'ready', 'dialog-exit']);
const currentElement = ref(null);
const isInternal = ref(props.data.isInternal);
const isEditing = ref(false);
const currentComment = ref('');
const isFocused = ref(false);

const addComment = () => {
  const value = currentComment.value;
  if (!value) return;
  
  // create the new comment for the conversation
  const comment = useComment({
    user: {
      email: props.user.email,
      name: props.user.name,
    },
    timestamp: new Date(),
    comment: value,
  });

  // If this conversation is pending addition, add to the document first
  if (pendingComment.value && pendingComment.value.conversationId === props.data.conversationId) {
    const newConversation = { ...pendingComment.value }

    const parentBounds = props.parent.getBoundingClientRect();
    
    const selection = pendingComment.value.selection.getValues();
    selection.selectionBounds.top = selection.selectionBounds.top// - parentBounds.top;
    selection.selectionBounds.bottom = selection.selectionBounds.bottom// - parentBounds.top;

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
    newConversation.selection = useSelection(selection)    
    newConversation.comments.push(comment);

    // Suppress click if the selection was made by the super-editor
    newConversation.suppressClick = isSuppressClick(pendingComment.value.selection);
    newConversation.thread = newConversation.conversationId;

    // Remove the pending comment
    pendingComment.value = null;
    skipSelectionUpdate.value = true;

    const editor = proxy.$superdoc.activeEditor;
    if (editor) createNewEditorComment({ conversation: newConversation, editor });
  
    newConversation.isInternal = isInternal.value;
    props.currentDocument.conversations.push(newConversation);
    proxy.$superdoc.broadcastComments(COMMENT_EVENTS.ADD, props.data.getValues());
  } else {
    props.data.comments.push(comment);
    proxy.$superdoc.broadcastComments(COMMENT_EVENTS.ADD, props.data.getValues());
  }
  
  currentComment.value = '';
  emit('dialog-exit');
  activeComment.value = null;
}

const createNewEditorComment = ({ conversation, editor }) => {
  editor.commands.insertComment(conversation);
}

const isSuppressClick = (selection) => {
  return selection.source === 'super-editor' ? true : false;
}
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')}${meridiem}`;
  const formattedDate = `${formattedTime} ${month} ${day}`;
  return formattedDate;
}

const getSidebarCommentStyle = computed(() => {
  const style = {};
  if (isActiveComment.value) {
    style.backgroundColor = 'white';
    style.zIndex = 10;
  }

  if (!props.data.comments.length && currentElement.value) {
    const selectionBounds = props.data.selection.getContainerLocation(props.parent)
    const bounds = props.data.selection.selectionBounds;
    const parentTop = props.parent?.getBoundingClientRect()?.top || 0;
    const currentBounds = currentElement.value.getBoundingClientRect();
    style.top = (bounds.top) * activeZoom.value + 'px';
  }

  return style;
});

const cleanConversations = () => {
  if (props.data.comments.length) return;
  // if (!pendingComment.value) selectionPosition.value = null;
  const id = props.data.conversationId;
  pendingComment.value = null;
  props.currentDocument.removeConversation(id);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.DELETED, id);
}

const handleClickOutside = (e) => {
  if (e.target.classList.contains('n-dropdown-option-body__label')) return;
  if (activeComment.value === props.data.conversationId) {
    floatingCommentsOffset.value = 0;

    emit('dialog-exit');
    if (e.target.dataset.id) activeComment.value = e.target.dataset.id;
    else if (!e.target.dataset.threadId) activeComment.value = null;
    cleanConversations();
  }
}

const setFocus = () => {
  activeComment.value = props.data.conversationId;
}

const markDone = () => {
  const convo = getCurrentConvo();
  convo.markDone(props.user.email, props.user.name);
  props.currentDocument.removeConversation(convo.conversationId);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.RESOLVED, convo.getValues());
}

const cancelComment = () => {
  activeComment.value = null;
  pendingComment.value = null;
  if (!props.data.comments.length) {
    cleanConversations();
  }
}

const isActiveComment = computed(() => {
  return activeComment.value === props.data.conversationId;
});

const setConversationInternal = (state) => {
  isInternal.value = state === 'internal';
  const convo = getCurrentConvo();
  if (convo) {
    convo.isInternal = isInternal.value;
    proxy.$superdoc.broadcastComments(COMMENT_EVENTS.UPDATE, convo.getValues());
  }
}

const overflowOptions = [
  {
    label: 'Edit',
    key: 'edit',
  },
  {
    label: 'Delete',
    key: 'delete',
  },
  {
    label: 'Quote',
    key: 'delete',
    disabled: true,
  }
];

const getCurrentConvo = () => {
  return props.currentDocument.conversations.find((c) => c.conversationId === props.data.conversationId);
}

const handleOverflowSelection = (index, item, key) => {
  switch (key) {
    case 'edit':
      handleEdit(item);
      break;
    case 'delete':
      handleDelete(index);
      break;
    case 'quote':
      handleQuote();
      break;
  }
};

const handleEdit = (item) => {
  currentComment.value = item.comment;
  isEditing.value = item;
};

const handleDelete = (index) => {
  const convo = getCurrentConvo();
  if (!convo) return;

  if (convo.comments.length === 1) {
    props.currentDocument.removeConversation(convo.conversationId);
  } else {
    convo.comments.splice(index, 1);
  }

  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.DELETED, convo.conversationId);
};

const handleQuote = () => {
  // TODO: Implement quote functionality
  console.log('Quote');
};

const updateComment = (item) => {
  item.comment = currentComment.value;
  currentComment.value = '';
  const convo = getCurrentConvo();
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.UPDATE, convo.getValues());
  isEditing.value = false;
}

const showButtons = computed(() => {
  return !getConfig.readOnly && isActiveComment.value && !props.data.markedDone && !isEditing.value;
})
const showInputSection = computed(() => {
  return !getConfig.readOnly && isActiveComment.value && !props.data.markedDone && !isEditing.value;
});
const showSeparator = computed(() => (index) => {
  return props.data.comments.length > 1 && index !== props.data.comments.length - 1;
});

/**
 * Mark a tracked change as accepted or rejected. Only available in SuperEditor docs.
 */
const markAccepted = () => {
  const convo = getCurrentConvo();
  const editor = props.currentDocument.getEditor();
  editor.commands.acceptTrackedChange(convo.comments[0]);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.CHANGE_ACCEPTED, convo.getValues());

  const document = getDocument(convo.documentId);
  document.conversations = document.conversations.filter((c) => c.conversationId !== convo.conversationId);
};
const markRejected = () => {
  const convo = getCurrentConvo();
  const editor = props.currentDocument.getEditor();
  editor.commands.rejectTrackedChange(convo.comments[0]);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.CHANGE_REJECTED, convo.getValues());

  const document = getDocument(convo.documentId);
  document.conversations = document.conversations.filter((c) => c.conversationId !== convo.conversationId);
};

onMounted(() => {
  emit('ready', props.data.conversationId, currentElement);
});
</script>

<template>
  <div
      v-if="areDocumentsReady"
      class="comments-dialog"
      :class="{ 'is-active': isActiveComment }"
      @click.stop.prevent="setFocus"
      :id="data.conversationId"
      :style="getSidebarCommentStyle"
      v-click-outside="handleClickOutside"
      ref="currentElement">

    <!-- internal/external dropdown when conversation has comments -->
    <div v-if="!pendingComment && !data.isTrackedChange && !suppressInternalExternal" class="existing-internal-input">
      <InternalDropdown
          class="internal-dropdown"
          :state="props.data.isInternal ? 'internal' : 'external'"
          @select="setConversationInternal($event)" />
    </div>

    <!-- Comments -->
    <div v-for="(item, index) in data.comments" class="comment-container">
      <div class="card-section comment-header">
        <div class="comment-header-left">
          <div class="avatar">
            <Avatar :user="item.user" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ item.user.name }}</div>
            <div class="user-timestamp">{{ formatDate(item.timestamp) }}</div>
          </div>
        </div>

         <!-- Tracked changes don't have resolution, only accept / reject -->
        <div class="overflow-menu" v-if="data.isTrackedChange && index === 0">
          <i
              class="fal fa-check"
              @click.stop.prevent="markAccepted"
              title="Accept change">
          </i>
          <i
              class="fal fa-times"
              @click.stop.prevent="markRejected"
              title="Reject change">
          </i>
          
        </div>

        <!-- comment actions -->
        <div class="overflow-menu" v-else>
          <i
              v-if="index === 0 && getConfig.allowResolve"
              class="fal fa-check"
              @click.stop.prevent="markDone"
              title="Mark done and hide comment thread">
          </i>
          
          <!-- <n-dropdown
              trigger="click"
              :options="overflowOptions"
              @select="handleOverflowSelection(index, item, $event)">
                <i class="fal fa-ellipsis-v" title="More options"></i>
          </n-dropdown> -->
        </div>
      </div>

      <!-- Tracked change comment area -->
      <div class="card-section comment-body" v-if="data.isTrackedChange && index === 0">
        <div class="comment tracked-change" v-if="item.trackedChange?.insertion">
          <span class="change-type">Add: </span>
          {{ item.trackedChange.insertion }}
        </div>
        <div class="comment tracked-change" v-if="item.trackedChange?.deletion">
          <span class="change-type">Remove: </span>
          {{ item.trackedChange.deletion }}
        </div>
      </div>

      <!-- Comment area -->
      <div class="card-section comment-body" v-else>
        <div class="comment" v-if="item !== isEditing" v-html="item.comment"></div>

        <div class="comment-editing" v-else-if="item === isEditing && !getConfig.readOnly">
          <div class="comment-entry" :class="{ 'input-active': isFocused }">
            <SuperInput 
              class="superdoc-field" 
              placeholder="Add a comment"
              v-model="currentComment"
              :users="superdocStore.users"
              @focus="isFocused = true;" 
              @blur="isFocused = false;" />
          </div>
          <div class="comment-footer">
            <button class="sd-button" @click.stop.prevent="cancelComment">Cancel</button>
            <button class="sd-button primary" @click.stop.prevent="updateComment(item)">Update</button>
          </div>
        </div>

      </div>
      <div class="comment-separator" v-if="showSeparator(index)"></div>
    </div>

    <!-- New comment entry -->
    <div class="input-section" v-if="showInputSection && !getConfig.readOnly">
      <div class="comment-header">
        <div class="comment-header-left">
          <div class="avatar">
            <Avatar :user="props.user" />
          </div>
          <div class="user-info">
            <div class="user-name">{{ props.user.name }}</div>
            <div class="user-timestamp"></div>
          </div>
        </div>
      </div>
      <div class="comment-entry" :class="{ 'input-active': isFocused }">
        <SuperInput 
            class="superdoc-field"
            placeholder="Add a comment"
            v-model="currentComment"
            :users="superdocStore.users"
            @focus="isFocused = true;" 
            @blur="isFocused = false;" />
      </div>
      <InternalDropdown
          class="internal-dropdown initial-internal-dropdown"
          v-if="pendingComment && !suppressInternalExternal"
          @select="setConversationInternal($event)" />
    </div>

    <!-- footer buttons -->
    <div class="comment-footer" v-if="showButtons && !getConfig.readOnly">
      <button class="sd-button" @click.stop.prevent="cancelComment">Cancel</button>
      <button class="sd-button primary" @click.stop.prevent="addComment">Comment</button>
    </div>

  </div>
</template>

<style scoped>
.change-type {
  font-style: italic;
  font-weight: 600;
}
.comment-separator {
  background-color: #DBDBDB;
  height: 1px;
  width: 100%;
  margin: 15px 0;
}
.existing-internal-input {
  margin-bottom: 10px;
}
.initial-internal-dropdown {
  margin-top: 10px;
}
.comments-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  padding: 10px 15px;
  border-radius: 12px;
  background-color: #F3F6FD;
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
.overflow-menu {
  flex-shrink: 1;
  display: flex;
}

.overflow-menu__icon {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 250ms ease;
  padding: 3px;
  margin-left: 2px;
  cursor: pointer;
}

.overflow-menu__icon:hover {
  background-color: #DBDBDB;
}

.overflow-menu__icon :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  display: block;
  fill: currentColor;
}
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.comment-header-left {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.avatar {
  margin-right: 10px;
}
.user-info {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.user-name {
  font-weight: 600;
  line-height: 1.2em;
}
.user-timestamp {
  line-height: 1.2em;
  font-size: 12px;
  color: #999;
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
.conversation-item {
  border-bottom: 1px solid #DBDBDB;
  padding-bottom: 10px;
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
.comment-entry {
  border-radius: 8px;
  border: 1px solid #DBDBDB !important;
  width: 100%;
  transition: all 250ms ease;
}
.tracked-change {
  margin: 0;
}
</style>
