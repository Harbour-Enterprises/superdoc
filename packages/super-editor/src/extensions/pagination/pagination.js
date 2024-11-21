import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@core/Extension.js';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { createApp, h } from 'vue';
import PageBreak from '@/components/PageBreak/PageBreak.vue';

let isDebugging = false;
const paginationPluginKey = new PluginKey('paginationPlugin');

export const Pagination = Extension.create({
  name: 'pagination',

  addStorage() {
    return {
      height: 0,
    };
  },

  /**
   * The pagination plugin is responsible for calculating page breaks, and redering them using decorations.
   * This does not change the document schema itself (** and this is important **).
   */
  addPmPlugins() {
    const editor = this.editor;
    let isUpdating = false;

    // Used to prevent unnecessary transactions
    let shouldUpdate = false;

    // Track wether the first load has occured or not
    let hasInitialized = false;

    const paginationPlugin = new Plugin({
      key: paginationPluginKey,
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, decorationSet, oldState, newState) {
          // Check for new decorations passed via metadata
          const meta = tr.getMeta(paginationPluginKey);
          if (meta) {
            return meta;
          }

          // If the transaction requests to clear decorations, do so here
          // This is required so that we always calculate decorations based on a clean doc, since
          // node positions can change after a transaction
          if (tr.getMeta('clearDecorations')) {
            return DecorationSet.empty;
          }

          // If the document hasn't changed, and we've already initialized, don't update
          if (oldState.doc.eq(newState.doc) && hasInitialized) {
            shouldUpdate = false;
            return decorationSet.map(tr.mapping, newState.doc);
          }

          // Map existing decorations if no specific update is requested
          shouldUpdate = true;
          return decorationSet.map(tr.mapping, newState.doc);
        },
      },

      /* The view method is the most important part of the plugin */
      view: (view) => {
        const editorView = view;
        let previousDecorations = DecorationSet.empty;

        return {
          update: (view) => {
            if (!hasInitialized) {
              shouldUpdate = true;
              hasInitialized = true;
            }

            if (!shouldUpdate) return;
            if (isUpdating) return;

            // Throttle updates
            isUpdating = true;

            /**
             * Perform the actual update here.
             * We call calculatePageBreaks which actually generates the decorations
             */
            const performUpdate = () => {
              requestAnimationFrame(() => {
                // Step 1: Clear existing decorations
                const clearTransaction = view.state.tr.setMeta('clearDecorations', true);
                view.dispatch(clearTransaction);

                // Step 2: Recalculate decorations on the clean state
                const newDecorations = calculatePageBreaks(view, editor);

                // Skip updating if decorations haven't changed
                if (!previousDecorations.eq(newDecorations)) {
                  previousDecorations = newDecorations;
                  const updateTransaction = view.state.tr.setMeta(
                    paginationPluginKey,
                    newDecorations
                  );
                  view.dispatch(updateTransaction);
                };
                isUpdating = false;
                shouldUpdate = false;
              });
            };

            performUpdate();
          },
        };
      },
      props: {
        decorations(state) {
          return paginationPluginKey.getState(state);
        },
      },
    });

    return [paginationPlugin];
  },
});

const getHeaderHeight = (pageMargins) => {
  if (pageMargins.top > 1) {
    return pageMargins.top + pageMargins.header;
  }
  return pageMargins.top;
};

const getFooterHeight = (pageMargins) => {
  if (pageMargins.footer > pageMargins.bottom) {
    return pageMargins.footer + Math.abs(pageMargins.footer - pageMargins.bottom);
  };
  return pageMargins.bottom;
}


/**
 * Generate page breaks. This prepares the initial sizing, as well as appending the initial header and final footer
 * Then, call generateInternalPageBreaks to calculate the inner page breaks
 * @returns {DecorationSet} A set of decorations to be applied to the editor
 */
const calculatePageBreaks = (view, editor) => {
  // If we don't have a converter, return an empty decoration set
  // Since we won't be able to calculate page breaks without a converter
  if (!editor.converter) return DecorationSet.empty;

  const pageSize = editor.converter.pageStyles?.pageSize;
  const { width, height } = pageSize; // Page width and height are in inches
  const { pageMargins } = editor.converter.pageStyles;
  // console.debug('[pagination] margins', editor.converter.pageStyles.pageMargins);
  // console.debug('[pagination] page size', pageSize);

  // We can't calculate page breaks without a page width and height
  // Under normal docx operation, these are always set
  if (!width || !height) return DecorationSet.empty;

  const { state } = view;
  const headerHeight = getHeaderHeight(pageMargins);
  const footerHeight = getFooterHeight(pageMargins);
  const PAGE_HEIGHT = (height - headerHeight - footerHeight) * 96; // Convert to pixels

  if (isDebugging) console.debug('[pagination] page height', PAGE_HEIGHT);

  const doc = state.doc;
  const decorations = [];

  // Add the initial header
  const headerStyles = { borderRadius: '8px 8px 0 0' };
  const firstHeader = createPageBreak({ editor, suppressFooter: true, styles: headerStyles });
  decorations.push(Decoration.widget(0, firstHeader));

  // Calculate all page breaks
  generateInternalPageBreaks(doc, view, editor, decorations, PAGE_HEIGHT);

  // Add the final footer
  const lastFooter = createPageBreak({ editor, suppressHeader: true });
  decorations.push(Decoration.widget(doc.content.size, lastFooter));

  return DecorationSet.create(state.doc, decorations);
};

/**
 * Generate internal page breaks by iterating through the document, keeping track of the height.
 * If we find a node that extends past where our page should end, we add a page break.
 * @param {Node} doc The document node
 * @param {EditorView} view The editor view
 * @param {Editor} editor The editor instance
 * @param {Array} decorations The current set of decorations
 * @returns {void} The decorations array is altered in place
 */
function generateInternalPageBreaks(doc, view, editor, decorations, PAGE_HEIGHT) {
  let breaks = 1;
  let firstNode = false;
  let lastPageSize = 0;
  let pageHeightThreshold = PAGE_HEIGHT; // This will determine the bounds of each page

  doc.descendants((node, pos) => {
    const coords = view.coordsAtPos(pos);
    if (!firstNode) {
      firstNode = coords.bottom;

      // Shift the page threshold by the location of the first node
      pageHeightThreshold += coords.bottom;
    }

    const shouldAddPageBreak = coords.top > pageHeightThreshold;
    if (shouldAddPageBreak) {
      breaks++;
      lastPageSize = pageHeightThreshold - firstNode;
      pageHeightThreshold += PAGE_HEIGHT + 20;

      // This is where the decoration itself is generated
      decorations.push(Decoration.widget(pos - 1, createPageBreak({ editor, coords })));
    }
  });

  // Add blank padding to the last page to make a full page height
  const expectedHeight = PAGE_HEIGHT * breaks;
  const contentHeight = view.dom.scrollHeight;
  const padding = expectedHeight - contentHeight;
  const widget = Decoration.widget(doc.content.size, createFinalPagePadding({ editor, padding }));
  decorations.push(widget);
}

/**
 * Here we create final page padding in order to extend the last page to the full height of the document
 * @param {Number} param0 The padding to add to the final page in pixels
 * @returns {HTMLElement} The padding div
 */
function createFinalPagePadding({ padding }) {
  const div = document.createElement('div');
  div.style.height = padding + 'px';

  if (isDebugging) div.style.backgroundColor = '#00009944';
  return div;
};

/**
 * Creates an individual page break, either:
 * Header only
 * Footer only
 * Or, header plus footer plus page break
 * @param {Object} param0 Object containing the editor, coords, and optional styles
 * @returns 
 */
function createPageBreak({
  editor,
  coords,
  suppressFooter = false,
  suppressHeader = false,
  styles = {}
}) {
  const location = editor.options.element.getBoundingClientRect();
  const { pageStyles } = editor.converter;

  const div = document.createElement('div');
  if (!pageStyles) return div;

  const { pageSize, pageMargins } = pageStyles;
  const sectionHeight = calculateSectionHeight({
    pageMargins,
    suppressFooter,
    suppressHeader,
  });

  div.style.height = sectionHeight  + 'in'
  div.style.width = '10px';

  if (isDebugging) {
    console.debug('[pagination] section height', sectionHeight);
    div.style.backgroundColor = 'blue';
  }

  const headerData = getSectionData({
    editor,
    suppressFooter,
    type: 'header',
  });

  const footerData = getSectionData({
    editor,
    suppressHeader,
    type: 'footer'
  });

  if (headerData && isDebugging) {
    console.debug('[pagination] header data', headerData);
  }

  if (footerData && isDebugging) {
    console.debug('[pagination] footer data', footerData);
  }

  const data = {
    pageSize,
    pageMargins,
    headerData,
    footerData,
    location,
    sectionHeight,
    suppressFooter,
    suppressHeader,
    editor,
  };

  const header = createApp({
    render: () => h(PageBreak, { data, coords, sectionHeight, styles, isDebugging })
  });

  const mountDiv = document.createElement('div');
  header.mount(mountDiv);
  div.appendChild(mountDiv);

  return div;
};

/**
 * Calculate a header or footer height based on the available data
 * @param {Object} param0 Object containing the editor and suppress flags
 * @returns 
 */
function calculateSectionHeight({
  pageMargins,
  suppressFooter,
  suppressHeader,
}) {
  const separatorHeight = 0.208;
  const headerHeight = getHeaderHeight(pageMargins);
  const footerHeight = getFooterHeight(pageMargins);
  if (suppressFooter) return headerHeight;
  if (suppressHeader) return footerHeight;
  return headerHeight + footerHeight + separatorHeight;
}

function getSectionData({ editor, suppressHeader, suppressFooter, type }) {
  const ids = editor.converter[`${type}Ids`];
  const sections = editor.converter[`${type}s`];

  if ((type === 'header' && suppressFooter) || (type === 'footer' && suppressHeader)) {
    const firstId = ids.first;
    return sections[firstId] || sections[ids.default];
  }

  return sections[ids.default];
}
