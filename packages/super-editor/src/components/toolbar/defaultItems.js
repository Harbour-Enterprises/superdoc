import { undoDepth, redoDepth } from "prosemirror-history";
import { sanitizeNumber } from "./helpers";
import { computed, h, onActivated, onDeactivated } from "vue";
import { useToolbarItem } from "./use-toolbar-item";
import IconGrid from "./IconGrid.vue";
import AlignmentButtons from "./AlignmentButtons.vue";
import LinkInput from "./LinkInput.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export const makeDefaultItems = (superToolbar) => {
  // bold
  const bold = useToolbarItem({
    type: "button",
    name: "bold",
    command: "toggleBold",
    icon: "fa fa-bold",
    tooltip: "Bold",
  });

  // font
  const fontButton = useToolbarItem({
    type: "button",
    name: "fontFamily",
    tooltip: "Font",
    command: "setFontFamily",
    overflowIcon: "fa-font",
    defaultLabel: "Arial",
    label: "Arial",
    markName: "textStyle",
    labelAttr: "fontFamily",
    hasCaret: true,
    isWide: true,
    style: { width: "120px" },
    options: [
      {
        label: "Georgia",
        key: "Georgia, serif",
        fontWeight: 400,
        props: {
          style: { fontFamily: "Georgia, serif" },
        }
      },
      {
        label: "Arial",
        key: "Arial, sans-serif",
        fontWeight: 400,
        props: {
          style: { fontFamily: "Arial, sans-serif" },
        }
      },
      {
        label: "Courier New",
        key: "Courier New, monospace",
        fontWeight: 400,
        props: {
          style: { fontFamily: "Courier New, monospace" },
        }
      },
      {
        label: "Times New Roman",
        key: "Times New Roman, serif",
        fontWeight: 400,
        props: {
          style: { fontFamily: "Times New Roman, serif" },
        }
      },
    ],
    onActivate: (fontFamily) => {
      if (!fontFamily) return;
      fontButton.label.value = fontFamily;
    },
    onDeactivate: () => fontButton.label.value = fontButton.defaultLabel.value,
  });

  // font size
  const fontSize = useToolbarItem({
    type: "button",
    name: "fontSize",
    defaultLabel: "12",
    label: "12",
    minWidth: "50px",
    markName: "textStyle",
    labelAttr: "fontSize",
    tooltip: "Font size",
    overflowIcon: "fa-text-height",
    hasCaret: true,
    hasInlineTextInput: false,
    inlineTextInputVisible: true,
    isWide: true,
    command: "setFontSize",
    style: { width: "90px" },
    options: [
      { label: "8", key: "8pt" },
      { label: "9", key: "9pt" },
      { label: "10", key: "10pt" },
      { label: "11", key: "11pt" },
      { label: "12", key: "12pt" },
      { label: "14", key: "14pt" },
      { label: "18", key: "18pt" },
      { label: "24", key: "24pt" },
      { label: "30", key: "30pt" },
      { label: "36", key: "36pt" },
      { label: "48", key: "48pt" },
      { label: "60", key: "60pt" },
      { label: "72", key: "72pt" },
      { label: "96", key: "96pt" },
    ],
    onActivate: (size) => {
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
    type: "separator",
    name: "separator",
    icon: "fa-grip-lines-vertical",
    isNarrow: true,
  });

  // italic
  const italic = useToolbarItem({
    type: "button",
    name: "italic",
    command: "toggleItalic",
    icon: "fa fa-italic",
    active: false,
    tooltip: "Italic",
  });

  // underline
  const underline = useToolbarItem({
    type: "button",
    name: "underline",
    command: "toggleUnderline",
    icon: "fa fa-underline",
    active: false,
    tooltip: "Underline",
  });

  // color
  const colorButton = useToolbarItem({
    type: "button",
    name: "color",
    icon: "fa-font",
    hideLabel: true,
    markName: "textStyle",
    labelAttr: "color",
    overflowIcon: "fa-palette",
    active: false,
    tooltip: "Text color",
    command: "setColor",
    options: [
      {
        key: "color",
        type: "render",
        render: () => renderColorOptions(colorButton),
      },
    ],
    onActivate: (color) => {
      colorButton.iconColor.value = color;
    },
    onDeactivate: () => colorButton.iconColor.value = '#000',
  });

  const makeColorOption = (color, label = null) => {
    return {
      label,
      icon: "fa-circle",
      value: color,
      style: {
        color,
        boxShadow: "0 0 5px 1px rgba(0, 0, 0, 0.1)",
        borderRadius: "50%",
        fontSize: "1.25em",
      },
    };
  };
  const icons = [
    [
      makeColorOption("#111111"),
      makeColorOption("#333333"),
      makeColorOption("##5C5C5C"),
      makeColorOption("#858585"),
      makeColorOption("#ADADAD"),
      makeColorOption("#D6D6D6"),
      makeColorOption("#FFFFFF"),
    ],

    [
      makeColorOption("#860028"),
      makeColorOption("#D2003F"),
      makeColorOption("#DB3365"),
      makeColorOption("#E4668C"),
      makeColorOption("#ED99B2"),
      makeColorOption("#F6CCD9"),
      makeColorOption("#FF004D"),
    ],

    [
      makeColorOption("#83015E"),
      makeColorOption("#CD0194"),
      makeColorOption("#D734A9"),
      makeColorOption("#E167BF"),
      makeColorOption("#EB99D4"),
      makeColorOption("#F5CCEA"),
      makeColorOption("#FF00A8"),
    ],

    [
      makeColorOption("#8E220A"),
      makeColorOption("#DD340F"),
      makeColorOption("#E45C3F"),
      makeColorOption("#EB856F"),
      makeColorOption("#F1AE9F"),
      makeColorOption("#F8D6CF"),
      makeColorOption("#FF7A00"),
    ],

    [
      makeColorOption("#947D02"),
      makeColorOption("#E7C302"),
      makeColorOption("#ECCF35"),
      makeColorOption("#F1DB67"),
      makeColorOption("#F5E79A"),
      makeColorOption("#FAF3CC"),
      makeColorOption("#FAFF09"),
    ],

    [
      makeColorOption("#055432"),
      makeColorOption("#07834F"),
      makeColorOption("#399C72"),
      makeColorOption("#6AB595"),
      makeColorOption("#9CCDB9"),
      makeColorOption("#CDE6DC"),
      makeColorOption("#05F38F"),
    ],

    [
      makeColorOption("#063E7E"),
      makeColorOption("#0A60C5"),
      makeColorOption("#3B80D1"),
      makeColorOption("#6CA0DC"),
      makeColorOption("#9DBFE8"),
      makeColorOption("#CEDFF3"),
      makeColorOption("#00E0FF"),
    ],

    [
      makeColorOption("#3E027A"),
      makeColorOption("#6103BF"),
      makeColorOption("#8136CC"),
      makeColorOption("#A068D9"),
      makeColorOption("#C09AE6"),
      makeColorOption("#DFCDF2"),
      makeColorOption("#A91DFF"),
    ],
  ];

  function renderColorOptions(colorButton) {
    const handleSelect = (e) => {
      colorButton.iconColor.value = e;
      superToolbar.emitCommand({ item: colorButton, argument: e });
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
    type: "button",
    name: "link",
    markName: "link",
    icon: "fa-link",
    active: false,
    tooltip: "Link",
    options: [
      {
        type: 'render',
        key: 'linkDropdown',
        render: () => renderLinkDropdown(link),
      }
    ],
  });

  function renderLinkDropdown(link) {
    const handleSubmit = ({ href, text }) => {
      link.attributes.value.link = { href };
      const itemWithCommand = { ...link, command: "toggleLink", };
      superToolbar.emitCommand({ item: itemWithCommand, argument: { href, text: "test" } });

      if (!href) link.active.value = false
    };

    return h('div', {}, [
      h(LinkInput, {
        onSubmit: handleSubmit,
        initialUrl: link.attributes.value?.link?.href
      })
    ]);
  }

  const linkInput = useToolbarItem({
    type: "options",
    name: "linkInput",
    command: "toggleLink",
    active: false,
  });
  link.childItem = linkInput;
  linkInput.parentItem = link;

  // image
  const image = useToolbarItem({
    type: "button",
    name: "image",
    command: "toggleImage",
    icon: "fa-image",
    active: false,
    tooltip: "Image",
    disabled: true,
  });

  // alignment
  const alignment = useToolbarItem({
    type: "button",
    name: "textAlign",
    tooltip: "Alignment",
    icon: "fa-align-left",
    command: "setTextAlign",
    hasCaret: true,
    markName: "textAlign",
    labelAttr: "textAlign",
    options: [
      {
        type: "render",
        render: () => {
          const handleSelect = (e) => {
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
        key: "alignment",
      }
    ],
    onActivate: (value) => {
      setAlignmentIcon(alignment, value);
    },
    onDeactivate: () => {
      setAlignmentIcon(alignment, 'left');
    }
  });

  const setAlignmentIcon = (alignment, e) => {
    let alignValue = e === 'both' ? 'justify' : e;
    alignment.icon.value = `fa-align-${alignValue}`;
  }

  // bullet list
  const bulletedList = useToolbarItem({
    type: "button",
    name: "list",
    command: "toggleBulletList",
    icon: "fa-list",
    active: false,
    tooltip: "Bullet list",
  });

  // number list
  const numberedList = useToolbarItem({
    type: "button",
    name: "numberedlist",
    command: "toggleOrderedList",
    icon: "fa-list-numeric",
    active: false,
    tooltip: "Numbered list",
  });

  // indent left
  const indentLeft = useToolbarItem({
    type: "button",
    name: "indentleft",
    command: "decreaseTextIndent",
    icon: "fa-indent",
    active: false,
    tooltip: "Left indent",
    disabled: false,
  });

  // indent right
  const indentRight = useToolbarItem({
    type: "button",
    name: "indentright",
    command: "increaseTextIndent",
    icon: "fa-indent",
    active: false,
    tooltip: "Right indent",
    disabled: false,
  });

  // overflow
  const overflow = useToolbarItem({
    type: "button",
    name: "overflow",
    command: "toggleOverflow",
    icon: "fa-ellipsis-vertical",
    active: false,
    disabled: true,
  });

  const overflowOptions = useToolbarItem({
    type: "options",
    name: "overflowOptions",
    preCommand(self, argument) {
      self.parentItem.active = false;
    },
  });

  // zoom
  const zoom = useToolbarItem({
    type: "button",
    name: "zoom",
    tooltip: "Zoom",
    overflowIcon: "fa-magnifying-glass-plus",
    defaultLabel: "100%",
    label: "100%",
    hasCaret: true,
    command: "setZoom",
    isWide: true,
    style: { width: "100px" },
    inlineTextInputVisible: false,
    hasInlineTextInput: true,
    options: [
      { label: "50%", key: 0.5 },
      { label: "75%", key: 0.75 },
      { label: "90%", key: 0.9 },
      { label: "100%", key: 1 },
      { label: "125%", key: 1.25 },
      { label: "150%", key: 1.5 },
      { label: "200%", key: 2 },
    ],
    onActivate: (value) => {
      if (!value) return;
      zoom.label.value = String(value * 100) + "%";
    },
  });


  // undo
  const undo = useToolbarItem({
    type: "button",
    name: "undo",
    disabled: true,
    tooltip: "Undo",
    command: "undo",
    icon: "fa-solid fa-rotate-left",
    group: "left",
    onDeactivate: () => {
      if (superToolbar.undoDepth <= 0) undo.disabled.value = true;
      else undo.disabled.value = false;
    }
  });

  // redo
  const redo = useToolbarItem({
    type: "button",
    disabled: true,
    name: "redo",
    disabled: true,
    tooltip: "Redo",
    command: "redo",
    icon: "fa fa-rotate-right",
    group: "left",
    onDeactivate: () => {
      if (superToolbar.redoDepth <= 0) redo.disabled.value = true;
      else redo.disabled.value = false;
    }
  });

  // search
  const search = useToolbarItem({
    type: "button",
    name: "search",
    tooltip: "Search",
    disabled: true,
    icon: "fa-solid fa-magnifying-glass",
    group: "right",
  });

  const searchOptions = useToolbarItem({
    type: "options",
    name: "searchDropdown",
    command: "search",
  });

  const clearFormatting = useToolbarItem({
    type: "button",
    name: "clearFormatting",
    command: "clearFormat",
    tooltip: "Clear formatting",
    icon: "fa-text-slash",
  });

  const toolbarItemsMobile = [
    bold,
    italic,
    underline,
    indentRight,
    indentLeft,
    search,
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

  let overflowItems = [];

  let windowResizeTimeout = null;

  const debounceSetOverflowItems = () => {
    clearTimeout(windowResizeTimeout);
    windowResizeTimeout = setTimeout(() => {
      setOverflowItems();
    }, 500);
  };

  const setOverflowItems = () => {
    const windowWidth = window.innerWidth;
    const mobileBreakpoint = 700;
    const tabletBreakpoint = 800;

    overflowItems = [];
    const items = [];
    const toolbarItemsBreakpoint = [];

    // mobile
    if (windowWidth < mobileBreakpoint)
      toolbarItemsBreakpoint.push(...toolbarItemsMobile);
    // tablet
    if (windowWidth >= mobileBreakpoint && windowWidth < tabletBreakpoint)
      toolbarItemsBreakpoint.push(...toolbarItemsTablet);
    // desktop
    if (windowWidth >= tabletBreakpoint)
      toolbarItemsBreakpoint.push(...toolbarItemsDesktop);

    // get intersection of mobile and toolbar items
    toolbarItems.forEach((item) => {
      if (
        !toolbarItemsBreakpoint.includes(item.name) &&
        item.type !== "separator"
      ) {
        items.push(item);
      }
    });

    overflowItems = items;
  };

  const copyFormat = useToolbarItem({
    type: "button",
    name: "copyFormat",
    tooltip: "Format painter",
    icon: "fa-solid fa-paint-roller",
    command: "copyFormat",
    active: false,
  });

  const documentMode = useToolbarItem({
    type: "button",
    name: "documentMode",
    tooltip: "Document editing mode",
    icon: "fa-solid fa-user-edit",
    defaultLabel: "Editing",
    label: "Editing",
    hasCaret: true,
    isWide: true,
    style: { width: "100px" },
    inlineTextInputVisible: false,
    hasInlineTextInput: true,
    group: 'right',
    options: [
      { label: "Editng", value: "editing", icon: renderIcon('fa-user-edit') },
      { label: "Suggesting", value: "suggesting", icon: renderIcon('fa-comment-dots') },
      { label: "Commenting", value: "commenting", icon: renderIcon('fa-comment-dots') },
      { label: "Viewing", value: "viewing", icon: renderIcon('fa-eye') },
    ],
  });

  function renderIcon(icon) {
    return () => {
      return h(FontAwesomeIcon, { icon: icon });
    }
  }


  const toolbarItems = [
    undo,
    redo,
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
    search,
  ];

  const desktopExclude = ["overflow"];
  const toolbarItemsDesktop = toolbarItems
    .map((item) => item.name)
    .filter((name) => !desktopExclude.includes(name));

  const mobileBreakpoint = (item) => toolbarItemsMobile.includes(item.name);
  const tabletBreakpoint = (item) => toolbarItemsTablet.includes(item.name);
  const desktopBreakpoint = (item) => toolbarItemsDesktop.includes(item.name);

  toolbarItems.forEach((item) => {
    item.isMobile = mobileBreakpoint(item);
    item.isTablet = tabletBreakpoint(item);
    item.isDesktop = desktopBreakpoint(item);
  });

  return toolbarItems;
};

export const setHistoryButtonStateOnUpdate = (toolbarItemsRef) => ({ editor, transaction }) => {
    // console.debug('[SuperEditor dev] Document updated', editor);
    // activeEditor = editor;

    const undo = toolbarItemsRef.value.find((item) => item.name === "undo");
    const redo = toolbarItemsRef.value.find((item) => item.name === "redo");

    undo.disabled = undoDepth(editor.state) <= 0;
    redo.disabled = redoDepth(editor.state) <= 0;
  };
