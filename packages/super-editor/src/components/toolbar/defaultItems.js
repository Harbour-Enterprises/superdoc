import { undoDepth, redoDepth } from 'prosemirror-history';
import { h, onDeactivated } from 'vue';

import { sanitizeNumber } from './helpers';
import { useToolbarItem } from './use-toolbar-item';
import IconGrid from './IconGrid.vue';
import AlignmentButtons from './AlignmentButtons.vue';
import LinkInput from './LinkInput.vue';
import DocumentMode from './DocumentMode.vue';

const closeDropdown = (dropdown) => {
  dropdown.expand.value = false;
};

export const makeDefaultItems = (superToolbar, isDev = false, windowWidth) => {
  // bold
  const bold = useToolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fas fa-bold',
    tooltip: 'Bold',
  });

  // font
  const fontButton = useToolbarItem({
    type: 'dropdown',
    name: 'fontFamily',
    tooltip: 'Font',
    command: 'setFontFamily',
    defaultLabel: 'Arial',
    label: 'Arial',
    markName: 'textStyle',
    labelAttr: 'fontFamily',
    hasCaret: true,
    isWide: true,
    style: { width: '70px' },
    suppressActiveHighlight: true,
    options: [
      {
        label: 'Georgia',
        key: 'Georgia, serif',
        fontWeight: 400,
        props: {
          style: { fontFamily: 'Georgia, serif' },
        }
      },
      {
        label: 'Arial',
        key: 'Arial, sans-serif',
        fontWeight: 400,
        props: {
          style: { fontFamily: 'Arial, sans-serif' },
        }
      },
      {
        label: 'Courier New',
        key: 'Courier New, monospace',
        fontWeight: 400,
        props: {
          style: { fontFamily: 'Courier New, monospace' },
        }
      },
      {
        label: 'Times New Roman',
        key: 'Times New Roman, serif',
        fontWeight: 400,
        props: {
          style: { fontFamily: 'Times New Roman, serif' },
        }
      },
    ],
    onActivate: ({ fontFamily }) => {
      if (!fontFamily) return;
      fontButton.label.value = fontFamily;
    },
    onDeactivate: () => fontButton.label.value = fontButton.defaultLabel.value,
  });

  // font size
  const fontSize = useToolbarItem({
    type: 'dropdown',
    name: 'fontSize',
    defaultLabel: '12',
    label: '12',
    minWidth: '50px',
    markName: 'textStyle',
    labelAttr: 'fontSize',
    tooltip: 'Font size',
    overflowIcon: 'fa-text-height',
    hasCaret: true,
    hasInlineTextInput: false,
    inlineTextInputVisible: true,
    suppressActiveHighlight: true,
    isWide: true,
    command: 'setFontSize',
    options: [
      { label: '8', key: '8pt' },
      { label: '9', key: '9pt' },
      { label: '10', key: '10pt' },
      { label: '11', key: '11pt' },
      { label: '12', key: '12pt' },
      { label: '14', key: '14pt' },
      { label: '18', key: '18pt' },
      { label: '24', key: '24pt' },
      { label: '30', key: '30pt' },
      { label: '36', key: '36pt' },
      { label: '48', key: '48pt' },
      { label: '60', key: '60pt' },
      { label: '72', key: '72pt' },
      { label: '96', key: '96pt' },
    ],
    onActivate: ({ fontSize: size }) => {
      if (!size) return fontSize.label.value = fontSize.defaultLabel.value;

      let sanitizedValue = sanitizeNumber(size, 12);
      if (sanitizedValue < 8) sanitizedValue = 8;
      if (sanitizedValue > 96) sanitizedValue = 96;

      // no units
      fontSize.label.value = String(sanitizedValue);
    },
    onDeactivate: () => fontSize.label.value = fontSize.defaultLabel.value,
  });

  // separator
  const separator = useToolbarItem({
    type: 'separator',
    name: 'separator',
    icon: 'fa-grip-lines-vertical',
    isNarrow: true,
  });
  const separatorRight = useToolbarItem({
    type: 'separator',
    name: 'separator',
    icon: 'fa-grip-lines-vertical',
    isNarrow: true,
    group: 'right'
  });

  // italic
  const italic = useToolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: 'Italic',
  });

  // underline
  const underline = useToolbarItem({
    type: 'button',
    name: 'underline',
    command: 'toggleUnderline',
    icon: 'fa fa-underline',
    active: false,
    tooltip: 'Underline',
  });

  // color
  const colorButton = useToolbarItem({
    type: 'dropdown',
    name: 'color',
    icon: 'fas fa-font',
    hideLabel: true,
    markName: 'textStyle',
    labelAttr: 'color',
    overflowIcon: 'fa-palette',
    active: false,
    tooltip: 'Text color',
    command: 'setColor',
    suppressActiveHighlight: true,
    options: [
      {
        key: 'color',
        type: 'render',
        render: () => renderColorOptions(colorButton),
      },
    ],
    onActivate: ({ color }) => {
      colorButton.iconColor.value = color;
    },
    onDeactivate: () => colorButton.iconColor.value = '#000',
  });

  const makeColorOption = (color, label = null) => {
    return {
      label,
      icon: 'fas fa-circle',
      value: color,
      style: {
        color,
        boxShadow: '0 0 5px 1px rgba(0, 0, 0, 0.1)',
        borderRadius: '50%',
        fontSize: '1.25em',
      },
    };
  };
  const icons = [
    [
      makeColorOption('#111111'),
      makeColorOption('#333333'),
      makeColorOption('##5C5C5C'),
      makeColorOption('#858585'),
      makeColorOption('#ADADAD'),
      makeColorOption('#D6D6D6'),
      makeColorOption('#FFFFFF'),
    ],

    [
      makeColorOption('#860028'),
      makeColorOption('#D2003F'),
      makeColorOption('#DB3365'),
      makeColorOption('#E4668C'),
      makeColorOption('#ED99B2'),
      makeColorOption('#F6CCD9'),
      makeColorOption('#FF004D'),
    ],

    [
      makeColorOption('#83015E'),
      makeColorOption('#CD0194'),
      makeColorOption('#D734A9'),
      makeColorOption('#E167BF'),
      makeColorOption('#EB99D4'),
      makeColorOption('#F5CCEA'),
      makeColorOption('#FF00A8'),
    ],

    [
      makeColorOption('#8E220A'),
      makeColorOption('#DD340F'),
      makeColorOption('#E45C3F'),
      makeColorOption('#EB856F'),
      makeColorOption('#F1AE9F'),
      makeColorOption('#F8D6CF'),
      makeColorOption('#FF7A00'),
    ],

    [
      makeColorOption('#947D02'),
      makeColorOption('#E7C302'),
      makeColorOption('#ECCF35'),
      makeColorOption('#F1DB67'),
      makeColorOption('#F5E79A'),
      makeColorOption('#FAF3CC'),
      makeColorOption('#FAFF09'),
    ],

    [
      makeColorOption('#055432'),
      makeColorOption('#07834F'),
      makeColorOption('#399C72'),
      makeColorOption('#6AB595'),
      makeColorOption('#9CCDB9'),
      makeColorOption('#CDE6DC'),
      makeColorOption('#05F38F'),
    ],

    [
      makeColorOption('#063E7E'),
      makeColorOption('#0A60C5'),
      makeColorOption('#3B80D1'),
      makeColorOption('#6CA0DC'),
      makeColorOption('#9DBFE8'),
      makeColorOption('#CEDFF3'),
      makeColorOption('#00E0FF'),
    ],

    [
      makeColorOption('#3E027A'),
      makeColorOption('#6103BF'),
      makeColorOption('#8136CC'),
      makeColorOption('#A068D9'),
      makeColorOption('#C09AE6'),
      makeColorOption('#DFCDF2'),
      makeColorOption('#A91DFF'),
    ],
  ];

  function renderColorOptions(colorButton) {
    const handleSelect = (e) => {
      colorButton.iconColor.value = e;
      superToolbar.emitCommand({ item: colorButton, argument: e });
      closeDropdown(colorButton);
    };
  
    return h('div', {}, [
      h(IconGrid, {
        icons,
        activeColor: colorButton.iconColor,
        onSelect: handleSelect,
      })
    ]);
  }

  // link
  const link = useToolbarItem({
    type: 'dropdown',
    name: 'link',
    markName: 'link',
    icon: 'fas fa-link',
    active: false,
    tooltip: 'Link',
    options: [
      {
        type: 'render',
        key: 'linkDropdown',
        render: () => renderLinkDropdown(link),
      }
    ],
    onActivate: ({ href }) => {
      if (href) link.attributes.value = { href };
      else link.attributes.value = {};
      link.expand.value = true;
    },
    onDeactivate: () => {
      link.attributes.value = {};
      link.expand.value = false;
    }
  });

  function renderLinkDropdown(link) {
    const handleSubmit = ({ href }) => {
      closeDropdown(link);
      link.attributes.value.link = { href };
      const itemWithCommand = { ...link, command: "toggleLink", };
      superToolbar.emitCommand({ item: itemWithCommand, argument: { href, text: "" } });
      if (!href) link.active.value = false
    };

    return h('div', {}, [
      h(LinkInput, {
        onSubmit: handleSubmit,
        href: link.attributes.value.href,
        goToAnchor: () => {
          closeDropdown(link);
          if (!superToolbar.activeEditor || !link.attributes.value?.href) return;
          const anchorName = link.attributes.value?.href?.slice(1);
          const container = superToolbar.activeEditor.element;
          const anchor = container.querySelector(`a[name='${anchorName}']`);
          if (anchor) {
            switch (anchorName) {
              case '_top':
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
              case '_bottom':
                container.scrollIntoView({ behavior: 'smooth', block: 'end' });
                break;
              default:
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      })
    ]);
  }

  const linkInput = useToolbarItem({
    type: 'options',
    name: 'linkInput',
    command: 'toggleLink',
    active: false,
  });
  link.childItem = linkInput;
  linkInput.parentItem = link;

  // image
  const image = useToolbarItem({
    type: 'button',
    name: 'image',
    command: 'setImage',
    icon: 'fas fa-image',
    active: false,
    tooltip: "Image",
    disabled: true,
  });

  // alignment
  const alignment = useToolbarItem({
    type: 'dropdown',
    name: 'textAlign',
    tooltip: 'Alignment',
    icon: 'fas fa-align-left',
    command: 'setTextAlign',
    hasCaret: true,
    markName: 'textAlign',
    labelAttr: 'textAlign',
    suppressActiveHighlight: true,
    options: [
      {
        type: 'render',
        render: () => {
          const handleSelect = (e) => {
            closeDropdown(alignment);
            const buttonWithCommand = { ...alignment, command: "setTextAlign" };
            buttonWithCommand.command = "setTextAlign";
            superToolbar.emitCommand({ item: buttonWithCommand, argument: e });
            setAlignmentIcon(alignment, e);
          };
        
          return h('div', {}, [
            h(AlignmentButtons, {
              onSelect: handleSelect,
            })
          ]);
        },
        key: 'alignment',
      }
    ],
    onActivate: ({ textAlign }) => {
      setAlignmentIcon(alignment, textAlign);
    },
    onDeactivate: () => {
      setAlignmentIcon(alignment, 'left');
    }
  });

  const setAlignmentIcon = (alignment, e) => {
    let alignValue = e === 'both' ? 'justify' : e;
    alignment.icon.value = `fas fa-align-${alignValue}`;
  }

  // bullet list
  const bulletedList = useToolbarItem({
    type: 'button',
    name: 'list',
    command: 'toggleBulletList',
    icon: 'fas fa-list',
    active: false,
    tooltip: 'Bullet list',
  });

  // number list
  const numberedList = useToolbarItem({
    type: 'button',
    name: 'numberedlist',
    command: 'toggleOrderedList',
    icon: 'fas fa-list-numeric',
    active: false,
    tooltip: 'Numbered list',
  });

  // indent left
  const indentLeft = useToolbarItem({
    type: 'button',
    name: 'indentleft',
    command: 'decreaseTextIndent',
    icon: 'fas fa-outdent',
    active: false,
    tooltip: 'Left indent',
    disabled: false,
  });

  // indent right
  const indentRight = useToolbarItem({
    type: 'button',
    name: 'indentright',
    command: 'increaseTextIndent',
    icon: 'fas fa-indent',
    active: false,
    tooltip: 'Right indent',
    disabled: false,
  });

  // overflow
  const overflow = useToolbarItem({
    type: 'overflow',
    name: 'overflow',
    command: 'toggleOverflow',
    icon: 'fas fa-ellipsis-vertical',
    active: false,
    disabled: false,
  });

  const overflowOptions = useToolbarItem({
    type: 'options',
    name: 'overflowOptions',
    preCommand(self, argument) {
      self.parentItem.active = false;
    },
  });

  // zoom
  const zoom = useToolbarItem({
    type: 'dropdown',
    name: 'zoom',
    allowWithoutEditor: true,
    tooltip: 'Zoom',
    overflowIcon: 'fa-magnifying-glass-plus',
    defaultLabel: '100%',
    label: '100%',
    hasCaret: true,
    command: 'setZoom',
    isWide: true,
    inlineTextInputVisible: false,
    hasInlineTextInput: true,
    options: [
      { label: '50%', key: 0.5 },
      { label: '75%', key: 0.75 },
      { label: '90%', key: 0.9 },
      { label: '100%', key: 1 },
      { label: '125%', key: 1.25 },
      { label: '150%', key: 1.5 },
      { label: '200%', key: 2 },
    ],
    onActivate: ({ zoom: value }) => {
      if (!value) return;

      zoom.label.value = value;
    },
  });
  
  // undo
  const undo = useToolbarItem({
    type: 'button',
    name: 'undo',
    disabled: true,
    tooltip: 'Undo',
    command: 'undo',
    icon: 'fa-solid fa-rotate-left',
    group: 'left',
    onDeactivate: () => {
      undo.disabled.value = !superToolbar.undoDepth;
    }
  });

  // redo
  const redo = useToolbarItem({
    type: 'button',
    disabled: true,
    name: 'redo',
    tooltip: 'Redo',
    command: 'redo',
    icon: 'fa fa-rotate-right',
    group: 'left',
    onDeactivate: () => {
      redo.disabled.value = !superToolbar.redoDepth;
    }
  });


  // Track changes test buttons
  const toggleTrackChanges = useToolbarItem({
    type: "button",
    disabled: false,
    name: "toggleTrackChanges",
    tooltip: "Track Changes",
    command: "toggleTrackChanges",
    icon: "fa-solid fa-list-check",
    group: "left",
  });

  const acceptTrackedChangeBySelection = useToolbarItem({
    type: "button",
    disabled: false,
    name: "acceptTrackedChangeBySelection",
    tooltip: "Accept Changes under selection",
    command: "acceptTrackedChangeBySelection",
    icon: "fa fa-calendar-check",
    group: "left",
  });

  const rejectTrackedChangeOnSelection = useToolbarItem({
    type: "button",
    disabled: false,
    name: "rejectTrackedChangeOnSelection",
    tooltip: "Reject Changes under selection",
    command: "rejectTrackedChangeOnSelection",
    icon: "fa fa-calendar-xmark",
    group: "left",
  });

  const toggleTrackChangesOriginal = useToolbarItem({
    type: "button",
    disabled: false,
    name: "toggleTrackChangesShowOriginal",
    tooltip: "Toggle Show Original",
    command: "toggleTrackChangesShowOriginal",
    icon: "fa fa-eye",
    group: "left",
  });

  const toggleTrackChangesFinal = useToolbarItem({
    type: "button",
    disabled: false,
    name: "toggleTrackChangesShowFinal",
    tooltip: "Toggle Show Final",
    command: "toggleTrackChangesShowFinal",
    icon: "fa-solid fa-file",
    group: "left",
  });
  //

  // search
  // const search = useToolbarItem({
  //   type: "button",
  //   allowWithoutEditor: true,
  //   name: "search",
  //   tooltip: "Search",
  //   disabled: true,
  //   icon: "fas fa-magnifying-glass",
  //   group: "right",
  // });

  const clearFormatting = useToolbarItem({
    type: 'button',
    name: 'clearFormatting',
    command: 'clearFormat',
    tooltip: 'Clear formatting',
    icon: 'fas fa-text-slash',
  });

  const toolbarItemsMobile = [
    bold,
    italic,
    underline,
    indentRight,
    indentLeft,
    // search,
    overflow,
  ].map((item) => item.name);

  const toolbarItemsTablet = [
    ...toolbarItemsMobile,
    ...[
      fontButton,
      fontSize,
      alignment,
      bulletedList,
      numberedList,
      overflow,
    ].map((item) => item.name),
  ];


  const copyFormat = useToolbarItem({
    type: 'button',
    name: 'copyFormat',
    tooltip: 'Format painter',
    icon: 'fal fa-paint-roller',
    command: 'copyFormat',
    active: false,
  });

  const documentMode = useToolbarItem({
    type: 'dropdown',
    name: 'documentMode',
    command: 'setDocumentMode',
    allowWithoutEditor: true,
    tooltip: 'Document editing mode',
    icon: 'fal fa-user-edit',
    defaultLabel: 'Editing',
    label: 'Editing',
    hasCaret: true,
    isWide: true,
    style: { display: 'flex', justifyContent: 'flex-end' },
    inlineTextInputVisible: false,
    hasInlineTextInput: true,
    group: 'right',
    attributes: {
      dropdownPosition: 'right',
      className: 'doc-mode'
    },
    options: [
      {
        type: 'render',
        render: () => renderDocumentMode(documentMode),
      }
    ]
  });

  const documentOptions = [
    { label: "Editing", value: "editing", icon: 'fal fa-user-edit', description: "Edit document directly", },
    { label: "Suggesting", value: "suggesting", icon: 'fal fa-comment-edit', description: "Edits become suggestions" },
    { label: "Viewing", value: "viewing", icon: 'fal fa-eye', description: "View clean version of document only" },
  ];

  function renderDocumentMode(renderDocumentButton) {
    return h(DocumentMode, 
      {
        options: documentOptions,
        onSelect: (item) => {
          closeDropdown(renderDocumentButton);
          const { label, icon } = item;
          documentMode.label.value = label;
          documentMode.icon.value = icon;
          superToolbar.emitCommand({ item: documentMode, argument: label });
        },
      }
    );
  }
  // define sizes to calculate toolbar overflow items
  const controlSizes = new Map([
    ['separator', 20],
    ['textAlign', 37],
    ['documentMode', 45],
    ['zoom', 70],
    ['fontSize', 56],
    ['fontFamily', 72],
    ['default', 32]
  ]);

  // Responsive toolbar calculations
  const itemsToHide = ['zoom', 'fontFamily', 'fontSize', 'redo'];
  const hideWideItemsEndpoint = 600;
  const toolbarPadding = 32;
  const stickyItemsWidth = 120;
  
  let toolbarItems = [
    undo,
    redo,

    // Dev - tracked changes
    toggleTrackChanges,
    acceptTrackedChangeBySelection,
    rejectTrackedChangeOnSelection,
    toggleTrackChangesOriginal,
    toggleTrackChangesFinal,

    zoom,
    separator,
    fontButton,
    separator,
    fontSize,
    separator,
    bold,
    italic,
    underline,
    colorButton,
    separator,
    link,
    image,
    separator,
    alignment,
    bulletedList,
    numberedList,
    indentLeft,
    indentRight,
    separator,
    copyFormat,
    clearFormatting,
    overflow,
    documentMode,
    // separatorRight,
    // search,
  ];
  
  // Hide separators on small screens
  if (windowWidth <= hideWideItemsEndpoint) {
    toolbarItems = toolbarItems.filter(item => item.type !== 'separator');
  }

  // Track changes test buttons
  const devItems = [
    toggleTrackChanges, 
    acceptTrackedChangeBySelection, 
    rejectTrackedChangeOnSelection, 
    toggleTrackChangesOriginal, 
    toggleTrackChangesFinal
  ];

  if (!isDev) {
    toolbarItems = toolbarItems.filter((item) => !devItems.includes(item));
  }

  // always visible items
  const toolbarItemsSticky = [
    undo,
    overflow,
    documentMode,
  ].map((item) => item.name);
  
  const isStickyItem = (item) => toolbarItemsSticky.includes(item.name);
  
  const overflowItems = [];
  const visibleItems = [];
  // initial width with padding
  
  let totalWidth = toolbarPadding + stickyItemsWidth;
  toolbarItems.forEach((item) => {
    const itemWidth = controlSizes.get(item.name.value) || controlSizes.get('default');

    if (windowWidth < hideWideItemsEndpoint && itemsToHide.includes(item.name.value)) {
      overflowItems.push(item);
      return;
    }
    if (isStickyItem(item)) {
      visibleItems.push(item);
      totalWidth += itemWidth;
      return;
    }
    
    if (totalWidth < windowWidth) {
      visibleItems.push(item);
      totalWidth += itemWidth;
    } else {
      overflowItems.push(item);
    }
  });
  
  return {
    defaultItems: visibleItems,
    overflowItems: overflowItems.filter(item => item.type !== 'separator'),
  };
};

export const setHistoryButtonStateOnUpdate = (toolbarItemsRef) => ({ editor, transaction }) => {
    // console.debug('[SuperEditor dev] Document updated', editor);
    // activeEditor = editor;

    const undo = toolbarItemsRef.value.find((item) => item.name === 'undo');
    const redo = toolbarItemsRef.value.find((item) => item.name === 'redo');

    undo.disabled = undoDepth(editor.state) <= 0;
    redo.disabled = redoDepth(editor.state) <= 0;
  };
