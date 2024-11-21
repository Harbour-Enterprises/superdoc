<script setup>
import { getCurrentInstance, ref, reactive, computed, onMounted } from 'vue';
import { SuperEditor } from '@/index';
import { Editor } from '@vue-3/index.js';

import { getStarterExtensions } from '@extensions';
import { backTopDark } from 'naive-ui';

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  coords: {
    type: Object,
    required: false,
  },
  sectionHeight: {
    type: Number,
    required: false,
  },
  styles: {
    type: Object,
    required: false,
  },
  isDebugging: {
    type: Boolean,
    required: false,
  }
});

const { proxy } = getCurrentInstance();

const pageBreakContainer = ref(null);
const headerStylesRef = reactive({});
const headerElement = ref(null);
const footerElement = ref(null);
const headerData = ref(null);

const getHeaderStyles = computed(() => {
  return headerStylesRef;
});

/* Editor options */
const editorOptions = {
  editable: false,
}

/**
 * Mount the header, if any, into this page break
 */
const mountHeader = () => {
  if (!props.data.headerData) return;
  new Editor({
    loadFromSchema: true,
    mode: 'text',
    editable: false,
    element: headerElement.value,
    content: props.data.headerData,
    extensions: getStarterExtensions(),
    documentId: props.data.editor.options.documentId + ('-header'),
    ...editorOptions,
  });
};

/**
 * Mount the footer, if any, into this page break
 */
const mountFooter = () => {
  if (!props.data.footerData) return;
  new Editor({
    loadFromSchema: true,
    mode: 'text',
    editable: false,
    element: footerElement.value,
    content: props.data.footerData,
    extensions: getStarterExtensions(),
    documentId: props.data.editor.options.documentId + ('-footer'),
    ...editorOptions,
  });
};

/**
 * Styles for the header container
 */
 const headerContainerStyle = computed(() => {
  if (!props.data || !pageBreakContainer.value) return {};
  const { pageSize, pageMargins } = props.data;

  const editorLeft = props.data.location.left;
  const containerLeft = pageBreakContainer.value.getBoundingClientRect().left;
  const leftDiff = containerLeft - editorLeft;

  const style = {
    height: props.sectionHeight + 'in',
    width: (pageSize.width * 96) - 1 + 'px',
    backgroundColor: props.isDebugging ? '#00009999' : 'none',
  }

  if (props.isDebugging) console.debug('headerContainerStyle', style);

  if (props.coords) {
    style.left = props.coords.left + 'px';
  }

  // If no coords, use the page margins
  style.left = pageMargins.left * -1 + 'in';
  style.width = (pageSize.width * 96) + 'px';

  return style;
});

/**
 * Get the padding for the header or footer
 * @param {String} type Header or footer
 * @param {Object} pageMargins The page margins from the converter
 */
const getPadding = (type, pageMargins) => {
  const basePadding = 0.16 + 'in';
  const extraPadding = 0.25 + 'in';

  return {
    marginTop: type === 'header' ? pageMargins.header : 0,
    marginBottom: type === 'header' ? 0 : pageMargins.footer
  };
};

/**
 * Get the styles for the header or footer
 */
const getSectionStyle = computed(() => (sectionType) => {
  const { pageSize, pageMargins } = props.data;
  const { marginTop, marginBottom } = getPadding(sectionType, pageMargins);

  const style = {
    height: props.sectionHeight  - marginTop + 'in',
    paddingLeft: `${pageMargins.left}in`,
    paddingRight: `${pageMargins.right}in`,
    marginTop: marginTop + 'in',
    marginBottom: marginBottom + 'in',
    borderBottom: sectionType === 'header' ? '1px solid #EFEFEF' : 'none',
    borderTop: sectionType === 'footer' ? '1px solid #EFEFEF' : 'none',
    backgroundColor: 'white',
    overflow: 'hidden',
    ...props.styles,
  };

  if (props.isDebugging === true) {
    style.backgroundColor = sectionType === 'header' ? '#00660099' : '#00009999';
  }

  return style;
});

/**
 * Only show separator if we have both a header and footer
 */
const showSeparator = computed(() => {
  return !props.data.suppressFooter && !props.data.suppressHeader;
});

onMounted(() =>{
  mountHeader(); 
  mountFooter();
});
</script>

<template>
  <div class="header-container" :style="headerContainerStyle" ref="pageBreakContainer">
    <div :style="getSectionStyle('footer')" v-if="!props.data.suppressFooter">
      <div ref="footerElement"></div>
    </div>

    <div class="separator" v-if="showSeparator"></div>

    <div :style="getSectionStyle('header')" v-if="!props.data.suppressHeader">
      <div ref="headerElement"></div>
    </div>

  </div>
</template>

<style scoped>
.separator {
  height: 20px;
  min-width: 100%;
  background-color: white;
  border-top: 1px solid #BDBDBD;
  border-bottom: 1px solid #BDBDBD;
  left: 0;
}
.header-container {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between; 
  position: relative;
  left: 0;
}
</style>