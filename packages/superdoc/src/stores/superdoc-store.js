import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import useDocument from '@/composables/use-document';

export const useSuperdocStore = defineStore('superdoc', () => {

  const documents = ref([]);
  const documentContainers = ref([]);
  const documentBounds = ref([]);
  const pages = reactive({});

  const isReady = ref(false);

  const user = reactive({ name: null, email: null });
  const modules = reactive({});
  
  const activeSelection = ref(null);
  const selectionPosition = ref(null);

  const init = (config) => {
    const { documents: docs, modules: configModules, user: configUser } = config;
    
    // Init current user
    Object.assign(user, configUser);
  
    // Set up module config
    Object.assign(modules, configModules);

    // Initialize document composables
    docs.forEach((doc) => {
      const smartDoc = useDocument(doc);
      documents.value.push(smartDoc);
    });
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
  }

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
    documents,
    documentContainers,
    documentBounds,
    pages,

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
    getPageBounds
  }
});