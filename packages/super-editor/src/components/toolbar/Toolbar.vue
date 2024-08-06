<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineProps } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import DropdownOptions from './DropdownOptions.vue';
import IconGrid from './IconGrid.vue';
import LinkInput from './LinkInput.vue';
import { ToolbarItem } from './ToolbarItem';
import { sanitizeNumber } from './helpers';
import { undoDepth, redoDepth } from 'prosemirror-history';
import { getMarksFromSelection } from '@helpers/getMarksFromSelection.js';

const props = defineProps({
    editorInstance: {
        type: Object,
        required: false,
    },
    updateTransaction: {
        type: Object,
        required: true,
    }
});

const makeToolbarItem = (item) => {
  return new ToolbarItem({...item, editor: props.editorInstance});
}

const closeOpenDropdowns = (currentItem = null) => {
  const parentToolbarItems = toolbarItems.value.filter(item => item.childItem);
  parentToolbarItems.forEach((item) => {
    if (currentItem) {
      if (item.name === currentItem.name) return;
      if (item.childItem && item.childItem.name === currentItem.name) return;
    }
    item.active = false;
    item.childItem.active = false;
    item.inlineTextInputVisible = false;
  });
}

const editorElement = document.querySelector('.super-editor');
if (editorElement) {
  editorElement.addEventListener('click', (e) => {
    closeOpenDropdowns();
  });
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

      const marks = getMarksFromSelection(self.editor.state)
      const link = marks.find(mark => mark.type.name === 'link');
      if (!link) return;

      link.attrs.href = href;
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

watch(() => props.updateTransaction, () => {
  undo.disabled = undoDepth(props.editorInstance.state) <= 0;
  redo.disabled = redoDepth(props.editorInstance.state) <= 0;
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

/**
 * The toolbar should be completly decoupled from the editor.
 * It shouldn't be dependant on Editor.js or vice-versa.
 * One toolbar should work for many editors.
*/

const handleButtonMouseEnter = (item) => {
  if (item.childItem?.active) return;
  const now = Date.now();
  const timeout = 800;
  item.tooltipTimeout = setTimeout(() => {
    if (now + timeout <= Date.now()) {
      item.tooltipVisible = true;
    }
  }, timeout);
}

const handleButtonMouseLeave = (item) => {
  // cancel timeout
  clearTimeout(item.tooltipTimeout);
  item.tooltipVisible = false;
}

const emit = defineEmits(['command', 'toggle', 'select']);

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
  const editorElement = document.getElementById('super-editor');
  editorElement?.addEventListener('click', (e) => {
    closeOpenDropdowns();
  });
})

onUnmounted(() => {
  window.addEventListener('resize', debounceSetOverflowItems);
})

const desktopExclude = ['overflow'];
const toolbarItemsDesktop = ref(toolbarItems.value.map((item) => item.name).filter((name) => !desktopExclude.includes(name)));

const mobileBreakpoint = (item) => toolbarItemsMobile.value.includes(item.name);
const tabletBreakpoint = (item) => toolbarItemsTablet.value.includes(item.name);
const desktopBreakpoint = (item) => toolbarItemsDesktop.value.includes(item.name);

const alignments = [
  [
    {defaultLabel: 'Left', icon: 'fa-align-left', value: 'left'},
    {defaultLabel: 'Center', icon: 'fa-align-center', value: 'center'},
    {defaultLabel: 'Right', icon: 'fa-align-right', value: 'right'},
    {defaultLabel: 'Justify', icon: 'fa-align-justify', value: 'justify'},
  ]
]

const fontSizeValues = [
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
]


const isButton = (item) => item.type === 'button';
const isSeparator = (item) => item.type === 'separator';
const isDropdown = (item) => item.type === 'dropdown';
const isToggle = (item) => item.type === 'toggle';
const isColorPicker = (item) => item.type === 'colorpicker';
const hasIcon = (item) => item.icon !== null;
const showOptions = (item, name) => item?.name === name && item?.active;

const executeItemCommands = (item, argument = null) => {
  console.log("Executing item commands", item, argument)

  item.preCommand(argument);

  emit('command', {command: item.command, argument});
}

const handleToolbarButtonClick = (item, argument = null) => {
  if (item.disabled) return;
  console.log("Toolbar button click", argument)
  closeOpenDropdowns(item);
  executeItemCommands(item, argument);
}

const handleDropdownOptionMouseEnter = (item, optionIndex) => {
  const option = item.options[optionIndex];
  option.active = true
}

const handleDropdownOptionMouseLeave = (item, optionIndex) => {
  const option = item.options[optionIndex];
  option.active = false
}

const handleToolbarButtonTextSubmit = (item, argument) => {
  if (item.disabled) return;
  closeOpenDropdowns(item);
  executeItemCommands(item, argument);
}
  
const onTextSelectionChange = (marks, selectionText = null) => {
  console.log("Text selection change", marks, selectionText)
}

defineExpose({
  onTextSelectionChange
});
</script>

<template>
  <div class="toolbar">

    <div v-for="item, index in toolbarItems"
    :key="index"
    :class="{
      narrow: item.isNarrow,
      wide: item.isWide,
      mobile: mobileBreakpoint(item),
      tablet: tabletBreakpoint(item),
      desktop: desktopBreakpoint(item),
    }"
    class="toolbar-item-ctn">

      <!-- toolbar separator -->
      <ToolbarSeparator v-if="isSeparator(item)" />

      <!-- Toolbar button -->
      <ToolbarButton v-if="isButton(item)"
        :disabled="item.disabled"
        :active="item.getActiveState()"
        :tooltip="item.tooltip"
        :tooltip-visible="item.tooltipVisible"
        :name="item.name"
        :icon="item.getIcon()"
        :label="item.getActiveLabel() || item.defaultLabel"
        :hide-label="item.hideLabel"
        :has-caret="item.hasCaret"
        :inline-text-input-visible="item.inlineTextInputVisible"
        :has-inline-text-input="item.hasInlineTextInput"
        :icon-color="item.getIconColor()"
        :has-icon="hasIcon(item)"
        @mouseenter="handleButtonMouseEnter(item)"
        @mouseleave="handleButtonMouseLeave(item)"
        @textSubmit="(argument) => handleToolbarButtonTextSubmit(item, argument)"
        @buttonClick="handleToolbarButtonClick(item)">

          <!-- font dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontFamilyDropdown')"
            :command="item.childItem.command"
            @optionEnter="(optionIndex) => handleDropdownOptionMouseEnter(item.childItem, optionIndex)"
            @optionLeave="(optionIndex) => handleDropdownOptionMouseLeave(item.childItem, optionIndex)"
            @optionClick="(option) => handleToolbarButtonClick(item, option)"
            :options="item.childItem.options"/>

          <!-- zoom dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'zoomDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="item.childItem.options"/>
          
          <!-- font size dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontSizeDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="fontSizeValues"/>

          <!-- color picker  -->
          <IconGrid
            v-if="showOptions(item.childItem, 'colorOptions')"
            :icons="item.childItem.options"
            @select="(color) => handleToolbarButtonClick(item, color)"/>

          <!-- alignment options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'alignmentOptions')"
          :icons="alignments"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>

          <!-- link input -->
          <LinkInput v-if="showOptions(item.childItem, 'linkInput')"
          :initial-url="editorInstance?.getAttributes('link')?.href"
          @submit="(anchor) => handleToolbarButtonClick(item.childItem, anchor)"
          @cancel="handleToolbarButtonClick({...item.childItem, command: null})"/>

          <!-- overflow options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'overflowOptions')"
          :icons="overflowIconGrid"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>
      </ToolbarButton>

      <!-- toolbar options -->
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  width: 100%;
  height: 39px;
  border-top: 1px solid #e8e8e863;
  border-bottom: 1px solid #e8e8e8;
  justify-content: space-around;
}

.toolbar-item-ctn {
  width: 4.5%;
  margin: 0 .2%;
  display: none;
}


@media (max-width: 700px) {
  .mobile {
    display: initial;
  }
}

@media (min-width: 700px) and (max-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: initial;
  }
}

@media (min-width: 800px) {
  .mobile {
    display: none;
  }
  .tablet {
    display: none;
  }
  .desktop {
    display: initial;
  }
}

.narrow {
  width: 1%;
  margin: 0 .2%;
}

.wide {
  width: 10%;
  margin: 0 1%;
}
</style>