<script setup>
import { computed, toRefs, ref, getCurrentInstance, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCommentsStore } from '@/stores/comments-store';
import { useSuperdocStore } from '@/stores/superdoc-store';
import useSelection from '@/helpers/use-selection';
import useComment from '@/components/CommentsLayer/use-comment';
import Avatar from '@/components/general/Avatar.vue';
import falCheckIcon from '@/assets/fontawesome/light/check.svg?raw';

const superdocStore = useSuperdocStore();
const commentsStore = useCommentsStore();
const { COMMENT_EVENTS } = commentsStore;
const { getConfig, activeComment, pendingComment, floatingCommentsOffset } = storeToRefs(commentsStore);
const { areDocumentsReady } = superdocStore;
const { selectionPosition, documentScroll } = storeToRefs(superdocStore);
const { proxy } = getCurrentInstance();

const props = defineProps({
  user: {
    type: Object,
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
const inputIsFocused = ref(false);
const input = ref(null);
const addComment = () => {
  if (!input.value?.value) return;

  // create the new comment for the conversation
  const comment = useComment({
    user: {
      email: props.user.email,
      name: props.user.name,
    },
    timestamp: new Date(),
    comment: input.value.value,
  });

  // If this conversation is pending addition, add to the document first
  if (pendingComment.value && pendingComment.value.conversationId === props.data.conversationId) {
    const newConversation = { ...pendingComment.value }

    const selection = pendingComment.value.selection.getValues();
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

     // Remove the pending comment
     pendingComment.value = null;
    
    // Reset the original selection
    selectionPosition.value = null;
    newConversation.comments.push(comment);
    props.currentDocument.conversations.push(newConversation);
    proxy.$superdoc.broadcastComments(COMMENT_EVENTS.ADD, props.data.getValues());
  } else {
    props.data.comments.push(comment);
    proxy.$superdoc.broadcastComments(COMMENT_EVENTS.ADD, props.data.getValues());
  }

  input.value.value = '';
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

const handleKeyUp = () => {
  addComment();
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
    const parentTop = props.parent.getBoundingClientRect().top;
    const currentBounds = currentElement.value.getBoundingClientRect();
    style.top = bounds.top + selectionBounds.top + documentScroll.value.scrollTop + 'px';
    style.width = 300 + 'px';
  }

  return style;
});

const cleanConversations = () => {
  if (props.data.comments.length) return;
  if (pendingComment.value) selectionPosition.value = null;
  const id = props.data.conversationId;
  pendingComment.value = null;
  props.currentDocument.removeConversation(id);
  proxy.$superdoc.broadcastComments(COMMENT_EVENTS.DELETED, id);
}

const handleClickOutside = (e) => {
  if (activeComment.value === props.data.conversationId) {
    floatingCommentsOffset.value = 0;

    emit('dialog-exit');
    if (e.target.dataset.id) activeComment.value = e.target.dataset.id;
    else activeComment.value = null;
    cleanConversations();
  }
}

const setFocus = () => {
  activeComment.value = props.data.conversationId;
}

const markDone = () => {
  const convo = props.currentDocument.conversations.find((c) => c.conversationId === props.data.conversationId);
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
      v-click-outside="handleClickOutside"
      :id="data.conversationId"
      :style="getSidebarCommentStyle"
      ref="currentElement">

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
        <div class="overflow-menu">
          <div class="overflow-menu__icon" 
            v-if="index === 0 && getConfig.allowResolve"
            @click.stop.prevent="markDone"
            v-html="falCheckIcon"
            title="Mark done and hide comment thread">
          </div>
        </div>
      </div>
      <div class="card-section comment-body">
        <div class="comment">
          {{ item.comment }}
        </div>
      </div>
    </div>

    <div class="card-section input-section" v-if="!getConfig.readOnly && isActiveComment && !props.data.markedDone">
      <div class="comment-entry">
        <input
            ref="input"
            type="text"
            placeholder="Add a comment..."
            @keyup.enter="handleKeyUp"
            @focus="inputIsFocused = true;"
            @click.stop.prevent />
      </div>
    </div>

    <div
        class="card-section comment-footer"
        v-if="!getConfig.readOnly && isActiveComment && !props.data.markedDone">
      <button class="sd-button primary" @click.stop.prevent="addComment">Comment</button>
      <button class="sd-button" @click.stop.prevent="cancelComment">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.comments-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 12px;
  background-color: #EDEDED;
  transition: background-color 250ms ease;
  -webkit-box-shadow: 0px 0px 1px 1px rgba(50, 50, 50, 0.15);
  -moz-box-shadow: 0px 0px 1px 1px rgba(50, 50, 50, 0.15);
  box-shadow: 0px 0px 1px 1px rgba(50, 50, 50, 0.15);
  z-index: 5;
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

.comment-entry {
  flex-grow: 1;
  margin: 5px 0;
}
.comment-entry input {
  border-radius: 12px;
  padding: 6px 10px;
  outline: none;
  border: 1px solid #DBDBDB;
  width: 100%;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.sd-button {
  margin-right: 5px;
  font-size: 12px;
}
.comment {
  font-size: 14px;
  margin: 5px 0;
}
.conversation-item {
  border-bottom: 1px solid #DBDBDB;
  padding-bottom: 10px;
}
.comment-footer {
  margin: 5px 0;
}
</style>