import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { useCommentsStore } from './comments-store';
import useDocument from '@/composables/use-document';

export const useSuperdocStore = defineStore('superdoc', () => {

  const commentsStore = useCommentsStore();
  const documents = ref([]);
  const documentContainers = ref([]);
  const documentBounds = ref([]);
  const pages = reactive({});
  const documentUsers = ref([]);
  const activeZoom = ref(1);
  const isReady = ref(false);

  const users = ref([]);

  const user = reactive({ name: null, email: null });
  const modules = reactive({});
  
  const activeSelection = ref(null);
  const selectionPosition = ref({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    source: null,
  })

  const reset = () => {
    documents.value = [];
    documentContainers.value = [];
    documentBounds.value = [];
    Object.assign(pages, {});
    documentUsers.value = [];
    isReady.value = false;
    user.name = null;
    user.email = null;
    Object.assign(modules, {});
    activeSelection.value = null;
  }

  const documentScroll = reactive({
    scrollTop: 0,
    scrollLeft: 0,
  })

  const init = (config) => {
    reset();
    const { documents: docs, modules: configModules, user: configUser, users: configUsers } = config;

    documentUsers.value = configUsers || [];

    // Init current user
    Object.assign(user, configUser);
  
    // Set up module config
    Object.assign(modules, configModules);

    // Initialize document composables
    docs.forEach((doc) => {
      const smartDoc = useDocument(doc, config);
      documents.value.push(smartDoc);
    });

    if ('comments' in modules) {
      commentsStore.suppressInternalExternal = modules.comments.suppressInternalExternal || false;
    }
    isReady.value = true;
  };

  const areDocumentsReady = computed(() => {
    for (let obj of documents.value.filter((doc) => doc.type === 'pdf')) {
      if (!obj.isReady) return false;
    }
    return true;
  });

  const getDocument = (documentId) => documents.value.find((doc) => doc.id === documentId);
  const getPageBounds = (documentId, page) => {
    const matchedPage = pages[documentId];
    if (!matchedPage) return;
    const pageInfo = matchedPage.find((p) => p.page == page);
    if (!pageInfo || !pageInfo.container) return;
    
    const containerBounds = pageInfo.container.getBoundingClientRect();
    const { height } = containerBounds;
    const totalHeight = height * (page - 1);
    return {
      top: totalHeight,
    }
  };

  const handlePageReady = (documentId, index, containerBounds) => {
    if (!pages[documentId]) pages[documentId] = [];
    pages[documentId].push({ page: index, containerBounds });

    const doc = getDocument(documentId);
    if (!doc) return;

    doc.pageContainers.push({
      page: index,
      containerBounds,
    });
  };

  return {
    commentsStore,
    documents,
    documentContainers,
    documentBounds,
    pages,
    documentUsers,
    users,
    activeZoom,
    documentScroll,

    selectionPosition,
    activeSelection,

    isReady,

    user,
    modules,
    
    // Getters
    areDocumentsReady,

    // Actions
    init,
    handlePageReady,
    getDocument,
    getPageBounds,
  }
});
