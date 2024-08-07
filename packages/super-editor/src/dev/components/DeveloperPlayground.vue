<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import BasicUpload from './BasicUpload.vue';
import BlankDOCX from '@common/data/blank.docx?url';
import LinkInput from '../../components/toolbar/LinkInput.vue';
import { ToolbarItem } from '@/components/toolbar/ToolbarItem';
import { sanitizeNumber } from '@/components/toolbar/helpers';
import { undoDepth, redoDepth } from 'prosemirror-history';
import { getMarksFromSelection } from '@helpers/getMarksFromSelection.js';

const inlineMenuMouseX = ref(0);
const inlineMenuMouseY = ref(0);

// Import the component the same you would in your app
import { SuperEditor, Toolbar } from '@/index';

let activeEditor = null;
const toolbarVisible = ref(false);

const toolbar = ref(null);
const currentFile = ref(null);
const DOC_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const handleNewFile = async (file) => {
  currentFile.value = null;

  // Generate a file url
  const fileUrl = URL.createObjectURL(file);
  currentFile.value = await getFileObject(fileUrl);
}

const getFileObject = async (fileUrl) => {
  // Generate a file url
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], 'docx-file.docx', { type: DOC_TYPE});
}

const commandsMap = {
  setFontSize: (args) => {
    let value = typeof args === 'object' ? args?.value : args;
    activeEditor.commands.setFontSize(value);
  },
  setFontFamily: (args) => {
    let value = args?.fontName;
    activeEditor.commands.setFontFamily(value);
  },
};

const linkInputItem = ref(null);

const handleSelectionChange = ({mark, coords}) => {
  if (mark) {
    linkInputItem.value = {
      url: mark.attrs.href,
    };
  } else {
    linkInputItem.value = null;
  }

  inlineMenuMouseX.value = coords.left;
  inlineMenuMouseY.value = coords.top + 20;
}

const handleToolbarCommand = ({ command, argument }) => {
  console.debug('[SuperEditor dev] Toolbar command', command, argument, activeEditor?.commands);

  const commands = activeEditor?.commands;
    if (!commands) {
    console.error('No commands');
    return;
  }
  
  const commandName = command;
  if (commandName in commands) {
    console.log('Executing command:', commandName);

    const command = commandsMap[commandName] 
      ? commandsMap[commandName] 
      : activeEditor.commands[commandName];

    command(argument);
    activeEditor.view.focus();
  } else {
    console.log('Command not found:', commandName);
  }    
};

const onSelectionUpdate = ({ editor, transaction }) => {
  const { from, to } = transaction.selection;
  activeEditor = editor;
  toolbarItems.value.forEach((item) => {
    item.editor = editor;
  })

  // This logic should maybe be inside the Editor.js rather than here?
  const { selection } = editor.view.state;
  const selectionText = selection.$head.parent.textContent;
  const marks = selection.$head.marks();
  const nodes = selection.$head.node();
  const coords = editor.view.coordsAtPos(selection.$head.pos);
  console.log("COORDS", coords);

  toolbar.value.onTextSelectionChange(marks, selectionText, coords);
}

const onCreate = ({ editor }) => {
  console.debug('[Dev] Editor created', editor);
  activeEditor = editor;
  toolbarVisible.value = true;

  window.editor = editor;
  console.debug('[Dev] Page styles (pixels)', editor.getPageStyles());
  console.debug('[Dev] document styles', editor.converter.getDocumentDefaultStyles());

  toolbarItems.value.forEach((item) => {
    item.editor = editor;
  })

  Object.assign(editorStyles, editor.converter.getDocumentDefaultStyles());
}

const handleLinkInputSubmit = (anchor) => {
  const {href} = anchor;
  // TODO - update existing mark
  handleToolbarCommand({command: 'toggleLink', argument: {href}});
}

const exportDocx = async () => {
  const result = await activeEditor?.exportDocx();
  const blob = new Blob([result], { type: DOC_TYPE });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exported.docx';
  a.click();
}

// toolbar

const makeToolbarItem = (item) => {
  return new ToolbarItem({...item, editor: activeEditor});
}

// bold
const bold = makeToolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    tooltip: "Bold",
});

// font
const fontButton = makeToolbarItem({
    type: 'button',
    name: 'fontFamily',
    tooltip: "Font",
    command: 'setFontFamily',
    overflowIcon: 'fa-font',
    defaultLabel: "Arial",
    markName: 'textStyle',
    labelAttr: 'fontFamily',
    hasCaret: true,
    isWide: true,
    style: {width: '120px'},
    preCommand(self, argument) {
      if (!argument) return;
      self.label = argument.label;
    }
});

const fontOptions = makeToolbarItem({
    type: 'options',
    name: 'fontFamilyDropdown',
    options: [
      {
        label: 'Georgia',
        fontName: 'Georgia, serif',
        fontWeight: 400,
      },
      {
        label: 'Arial',
        fontName: 'Arial, sans-serif',
        fontWeight: 400,
      },
      {
        label: 'Courier New',
        fontName: 'Courier New, monospace',
        fontWeight: 400,
        active: false,
        // options: [
        //   { label: 'Regular', fontWeight: 400 },
        //   { label: 'Bold', fontWeight: 700 },
        // ],
      },
      {
        label: 'Times New Roman',
        fontName: 'Times New Roman, serif',
        fontWeight: 400,
      },
    ]
})
fontButton.childItem = fontOptions;
fontOptions.parentItem = fontButton;

// font size
const fontSize = makeToolbarItem({
    type: 'button',
    name: 'fontSize',
    defaultLabel: "12",
    markName: 'textStyle',
    labelAttr: 'fontSize',
    tooltip: "Font size",
    overflowIcon: 'fa-text-height',
    hasCaret: true,
    hasInlineTextInput: true,
    isWide: true,
    command: "setFontSize",
    style: {width: '90px'},
    options: [
      {label: '8', value: '8pt'},
      {label: '9', value: '9pt'},
      {label: '10', value: '10pt'},
      {label: '11', value: '11pt'},
      {label: '12', value: '12pt'},
      {label: '14', value: '14pt'},
      {label: '18', value: '18pt'},
      {label: '24', value: '24pt'},
      {label: '30', value: '30pt'},
      {label: '36', value: '36pt'},
      {label: '48', value: '48pt'},
      {label: '60', value: '60pt'},
      {label: '72', value: '72pt'},
      {label: '96', value: '96pt'},
    ],
    preCommand(self) {
      self.inlineTextInputVisible = self.inlineTextInputVisible ? false : true;
      setTimeout(() => {
            const input = document.querySelector('#inlineTextInput-fontSize');
            if (input) input.focus();
        });
    },
    getActiveLabel(self) {
      let label = self._getActiveLabel() || self.defaultLabel;
      let sanitizedValue = sanitizeNumber(label, 12);
      if (sanitizedValue < 8) sanitizedValue = 8;
      if (sanitizedValue > 96) sanitizedValue = 96;

      // no units
      label = String(sanitizedValue);

      return label;
    }
});

const fontSizeOptions = makeToolbarItem({
    type: 'options',
    name: 'fontSizeDropdown',
    command: 'setFontSize',
    preCommand(self, argument) {
        self.parentItem.inlineTextInputVisible = false;

        const {label} = argument;
        self.parentItem.label = label;
    },
})
fontSize.childItem = fontSizeOptions;
fontSizeOptions.parentItem = fontSize;

// separator
const separator =  makeToolbarItem({
    type: 'separator',
    name: 'separator',
    icon: 'fa-grip-lines-vertical',
    isNarrow: true,
})

// italic
const italic = makeToolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: "Italic"
});

// underline
const underline = makeToolbarItem({
    type: 'button',
    name: 'underline',
    command: 'toggleUnderline',
    icon: 'fa fa-underline',
    active: false,
    tooltip: "Underline",
});

// color
const colorButton = makeToolbarItem({
    type: 'button',
    name: 'color',
    icon: 'fa-font',
    hideLabel: true,
    markName: 'textStyle',
    labelAttr: 'color',
    overflowIcon: 'fa-palette',
    active: false,
    tooltip: "Text color",
    command: 'setColor',
});

const makeColorOption = (color, label = null) => {
  return {
    label,
    icon: 'fa-circle',
    value: color,
    style: {
      color,
      boxShadow: "0 0 5px 1px rgba(0, 0, 0, 0.1)",
      borderRadius: "50%",
      fontSize: "1.25em",
    }
  }
}
const colorOptions = makeToolbarItem({
    name: 'colorOptions',
    type: 'options',
    preCommand(self) {
        self.parentItem.active = false;
  },
  options: [
    [
      makeColorOption('#111', 'Black'),
      makeColorOption('#333', 'Darker Grey'),
      makeColorOption('##5C5C5C', 'Dark Grey', ),
      makeColorOption('#858585', 'Grey'),
      makeColorOption('#ADADAD', 'Light Grey'),
      makeColorOption('#D6D6D6', 'Lighter Grey'),
      makeColorOption('#FFF', 'White'),
    ],

    [
      makeColorOption('#860028', 'Dark Red'),
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
      makeColorOption('#E167BF'),
      makeColorOption('#F5CCEA'),
      makeColorOption('#FF00A8'),
    ],

    [
      makeColorOption('#8E220A'),
      makeColorOption('#DD340F'),
      makeColorOption('#E45C3F'),
      makeColorOption('#EB856F'),
      makeColorOption('#DD340F'),
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
      makeColorOption('#FAFF09')
    ],

    [
      makeColorOption('#055432'),
      makeColorOption('#07834F'),
      makeColorOption('#399C72'),
      makeColorOption('#6AB595'),
      makeColorOption('#9CCDB9'),
      makeColorOption('#CDE6DC'),
      makeColorOption('#05F38F')
    ],

    [
      makeColorOption('#063E7E'),
      makeColorOption('#0A60C5'),
      makeColorOption('#3B80D1'),
      makeColorOption('#6CA0DC'),
      makeColorOption('#9DBFE8'),
      makeColorOption('#CEDFF3'),
      makeColorOption('#00E0FF')
    ],

    [
      makeColorOption('#3E027A'),
      makeColorOption('#6103BF'),
      makeColorOption('#8136CC'),
      makeColorOption('#A068D9'),
      makeColorOption('#C09AE6'),
      makeColorOption('#DFCDF2'),
      makeColorOption('#A91DFF')
    ]
  ]
});
colorButton.childItem = colorOptions;
colorOptions.parentItem = colorButton;

// link
const link = makeToolbarItem({
    type: 'button',
    name: 'link',
    markName: 'link',
    icon: 'fa-link',
    active: false,
    tooltip: "Link"
});

const linkInput = makeToolbarItem({
    type: 'options',
    name: 'linkInput',
    command: 'toggleLink',
    preCommand(self, argument) {
      if (!argument) return;
      const {href} = argument;
      const marks = getMarksFromSelection(activeEditor.view.state);
      const mark = marks.find(mark => mark.type.name === 'link') || null;
      console.log("Link mark", mark);
      if (mark) mark.attrs.href = href;
    },
    active: false,
});
link.childItem = linkInput;
linkInput.parentItem = link;

// image
const image = makeToolbarItem({
    type: 'button',
    name: 'image',
    command: 'toggleImage',
    icon: 'fa-image',
    active: false,
    tooltip: "Image",
    disabled: true,
});

// alignment
const alignment = makeToolbarItem({
    type: 'button',
    name: 'textAlign',
    tooltip: "Alignment",
    icon: "fa-align-left",
    hasCaret: true,
    markName: 'textAlign',
    labelAttr: 'textAlign',
    getIcon(self) {
      let alignment = self.editor?.getAttributes('paragraph').textAlign;
      if (!alignment) alignment = 'left';
      return `fa-align-${alignment}`;
    }
  });
  
  const alignmentOptions = makeToolbarItem({
    type: 'options',
    name: 'alignmentOptions',
    command: 'setTextAlign',
})
alignment.childItem = alignmentOptions;
alignmentOptions.parentItem = alignment;

// bullet list
const bulletedList = makeToolbarItem({
    type: 'button',
    name: 'list',
    command: 'toggleBulletList',
    icon: 'fa-list',
    active: false,
    tooltip: "Bullet list",
});

// number list
const numberedList = makeToolbarItem({
    type: 'button',
    name: 'numberedlist',
    command: 'toggleOrderedList',
    icon: 'fa-list-numeric',
    active: false,
    tooltip: "Numbered list",
});

// indent left
const indentLeft = makeToolbarItem({
    type: 'button',
    name: 'indentleft',
    command: 'decreaseTextIndent',
    icon: 'fa-indent',
    active: false,
    tooltip: "Left indent",
    disabled: false
});

// indent right
const indentRight = makeToolbarItem({
    type: 'button',
    name: 'indentright',
    command: 'increaseTextIndent',
    icon: 'fa-indent',
    active: false,
    tooltip: "Right indent",
    disabled: false
});

// overflow
const overflow = makeToolbarItem({
    type: 'button',
    name: 'overflow',
    command: 'toggleOverflow',
    icon: 'fa-ellipsis-vertical',
    active: false,
    tooltip: "More options",
    disabled: true
});

const overflowOptions = makeToolbarItem({
    type: 'options',
    name: 'overflowOptions',
    preCommand(self, argument) {
      self.parentItem.active = false;
    },
})
overflow.childItem = overflowOptions;
overflowOptions.parentItem = overflow;

// zoom
const zoom = makeToolbarItem({
    type: 'button',
    name: 'zoom',
    tooltip: "Zoom",
    overflowIcon: 'fa-magnifying-glass-plus',
    defaultLabel: "100%",
    hasCaret: true,
    isWide: true,
    style: {width: '100px'},
    inlineTextInputVisible: false,
    hasInlineTextInput: true,
    getActiveLabel(self) {
      return self.label || self.defaultLabel;
    },
    preCommand(self, argument) {
        clearTimeout(self.tooltipTimeout);
        self.inlineTextInputVisible = self.inlineTextInputVisible ? false : true;
        setTimeout(() => {
            const input = document.querySelector('#inlineTextInput-zoom');
            if (input) input.focus();
        });

        // from text input
        if (!argument) return;

        const editor = document.querySelector('.super-editor');
        const value = argument;
        let sanitizedValue = sanitizeNumber(value, 100);
        if (sanitizedValue < 0) sanitizedValue = 10;
        if (sanitizedValue > 200) sanitizedValue = 200;

        const label = String(sanitizedValue)+'%';
        self.label = label;
        editor.style.zoom = sanitizedValue/100;

        return sanitizedValue
    }
});

const zoomOptions = makeToolbarItem({
    type: 'options',
    name: 'zoomDropdown',
    preCommand(self, argument) {
        self.parentItem.active = false;
        self.parentItem.inlineTextInputVisible = false;
        
        const editor = document.querySelector('.super-editor');
        const {value, label} = argument;
        self.parentItem.label = label;
        editor.style.zoom = value;
    },
  options: [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '90%', value: 0.9 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
  ]
})
zoom.childItem = zoomOptions;
zoomOptions.parentItem = zoom;

// undo
const undo = makeToolbarItem({
    type: 'button',
    disabled: true,
    name: 'undo',
    disabled: true,
    tooltip: "Undo",
    command: "undo",
    icon: "fa-solid fa-rotate-left"
});

// redo
const redo = makeToolbarItem({
    type: 'button',
    disabled: true,
    name: 'redo',
    disabled: true,
    tooltip: "Redo",
    command: "redo",
    icon: 'fa fa-rotate-right'
});

// search
const search = makeToolbarItem({
    type: 'button',
    name: 'search',
    tooltip: "Search",
    disabled: true,
    icon: "fa-solid fa-magnifying-glass"
});

const searchOptions = makeToolbarItem({
    type: 'options',
    name: 'searchDropdown',
    command: 'search'
})
search.childItem = searchOptions;
searchOptions.parentItem = search;

const clearFormatting = makeToolbarItem({
    type: 'button',
    name: 'clearFormatting',
    command: 'clearFormat',
    tooltip: "Clear formatting",
    icon: 'fa-text-slash'
});

const onUpdate = ({ editor, transaction }) => {
  console.debug('[SuperEditor dev] Document updated', editor);
  activeEditor = editor;

  const undo = toolbarItems.value.find(item => item.name === 'undo');
  const redo = toolbarItems.value.find(item => item.name === 'redo');

  undo.disabled = undoDepth(activeEditor.state) <= 0;
  redo.disabled = redoDepth(activeEditor.state) <= 0;
}

const editorStyles = reactive({ });
const editorOptions = {
  onCreate,
  onSelectionUpdate,
  onUpdate
}

const toolbarItems = ref([
  zoom,
  undo,
  redo,
  separator,
  fontButton,
  fontSize,
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
  search,
  clearFormatting,
  overflow,
  // suggesting
  // TODO: Restore this later - removing for initial milestone
  // makeToolbarItem({
  //   type: 'toggle',
  //   defaultLabel: 'Suggesting',
  //   name: 'suggesting',
  //   command: null,
  //   icon: null,
  //   active: false,
  //   tooltip: "Suggesting",
  // }),
])

const toolbarItemsMobile = ref([
  bold,
  italic,
  underline,
  indentRight,
  indentLeft,
  search,
  overflow
].map((item) => item.name))

const toolbarItemsTablet = ref([
  ...toolbarItemsMobile.value,
  ...[
    fontButton,
    fontSize,
    alignment,
    bulletedList,
    numberedList,
    overflow
  ].map((item) => item.name)
])

const overflowItems = ref([]);

let windowResizeTimeout = null;

const debounceSetOverflowItems = () => {
  clearTimeout(windowResizeTimeout);
  windowResizeTimeout = setTimeout(() => {
    setOverflowItems();
  }, 500);
}

const setOverflowItems = () => {
  const windowWidth = window.innerWidth;
  const mobileBreakpoint = 700;
  const tabletBreakpoint = 800;

  overflowItems.value = [];
  const items = [];
  const toolbarItemsBreakpoint = [];

  // mobile
  if (windowWidth < mobileBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsMobile.value);
  // tablet
  if (windowWidth >= mobileBreakpoint && windowWidth < tabletBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsTablet.value);
  // desktop
  if (windowWidth >= tabletBreakpoint)
    toolbarItemsBreakpoint.push(...toolbarItemsDesktop.value);

  // get intersection of mobile and toolbar items
  toolbarItems.value.forEach(item => {
    if (!toolbarItemsBreakpoint.includes(item.name) && item.type !== 'separator') {
      items.push(item);
    }
  })

  overflowItems.value = items;
  console.log("Overflow items", overflowItems.value)
};

const overflowIconGrid = computed(() => [overflowItems.value.map((item) => (
    {
      defaultLabel: item.name,
      icon: item.overflowIcon || null,
      value: 'test'
    }
))]);

onMounted(() => {
  window.addEventListener('resize', debounceSetOverflowItems);
})

onUnmounted(() => {
  window.addEventListener('resize', debounceSetOverflowItems);
})

const desktopExclude = ['overflow'];
const toolbarItemsDesktop = ref(toolbarItems.value.map((item) => item.name).filter((name) => !desktopExclude.includes(name)));

const mobileBreakpoint = (item) => toolbarItemsMobile.value.includes(item.name);
const tabletBreakpoint = (item) => toolbarItemsTablet.value.includes(item.name);
const desktopBreakpoint = (item) => toolbarItemsDesktop.value.includes(item.name);

toolbarItems.value.forEach((item) => {
  item.isMobile = mobileBreakpoint(item);
  item.isTablet = tabletBreakpoint(item);
  item.isDesktop = desktopBreakpoint(item);
})

const alignments = [
  [
    {defaultLabel: 'Left', icon: 'fa-align-left', value: 'left'},
    {defaultLabel: 'Center', icon: 'fa-align-center', value: 'center'},
    {defaultLabel: 'Right', icon: 'fa-align-right', value: 'right'},
    {defaultLabel: 'Justify', icon: 'fa-align-justify', value: 'justify'},
  ]
]


onMounted(async () => {
  // set document to blank
  currentFile.value = await getFileObject(BlankDOCX);
})
</script>

<template>
  <div class="dev-app">
    <div class="header">
      <div class="left-side">
        <div class="title">
          <h2>Super Editor Dev Area</h2>
        </div>

        <!--
            A user using SuperEditor is expected to handle file uplodas and data sources on their own.
            SuperEditor just expects a URL to a docx file. This basic uploader is here for testing.
            You can also replace currentFile directly with a URL (ie: sampleDocxUrl).
        -->
        <div>
          Upload docx
          <BasicUpload @file-change="handleNewFile" />
        </div>
      </div>

      <div class="right-side">
        <button @click="exportDocx">Export</button>
      </div>
    </div>
    <div class="content" v-if="currentFile">

      <div class="content-inner">

        <LinkInput
        v-if="linkInputItem"
        :style="{top: inlineMenuMouseY+'px', left: inlineMenuMouseX+'px', zIndex: 3}"
        :initial-url="linkInputItem.url"
        @submit="handleLinkInputSubmit" />

        <Toolbar
        v-if="toolbarVisible"
        :toolbar-items="toolbarItems"
        @select="handleSelectionChange"
        @command="handleToolbarCommand" ref="toolbar" />
        <!-- SuperEditor expects its data to be a URL --> 
        <SuperEditor
            mode="docx"
            documentId="ID-122"
            :file-source="currentFile" 
            :options="editorOptions" />
      </div>

      </div>
  </div>
</template>

<style>
.ProseMirror p {
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.dev-app {
  display: flex;
  flex-direction: column;
}
.header {
  background-color: rgb(222, 237, 243);
  display: flex;
  justify-content: space-between;
  padding: 20px;
  margin-bottom: 20px;
}
.left-side {
  display: flex;
  flex-direction: column;
}
.right-side {
  display: flex;
  align-items: flex-end;
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.content-inner {
  width: 100%;
  max-width: 8.5in;
}
</style>
