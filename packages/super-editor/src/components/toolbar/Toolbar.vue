<script setup>
import { ref, onMounted, onUnmounted, computed, watch, defineProps } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSeparator from './ToolbarSeparator.vue';
import DropdownOptions from './DropdownOptions.vue';
import IconGrid from './IconGrid.vue';
import LinkInput from './LinkInput.vue';
import { createToolbarItem as ToolbarItem } from './ToolbarItem';

const props = defineProps({
    editorInstance: {
        type: Object,
        required: true,
    }
});

// bold
const bold = ToolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    tooltip: "Bold",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'bold';
    }
});

// font
const fontButton = ToolbarItem({
    type: 'button',
    name,
    tooltip: "Font",
    overflowIcon: 'fa-font',
    label: "Arial",
    hasCaret: true,
    isWide: true,
    style: {width: '120px'},
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
        self.label = mark.attrs.font;
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.label = "Arial";
    }
});

const fontOptions = ToolbarItem({
    type: 'options',
    name: 'fontFamilyDropdown',
    command: 'toggleFont',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
    },
    command: 'toggleFont',
})
fontButton.childItem = fontOptions;
fontOptions.parentItem = fontButton;

// font size
const fontSize = ToolbarItem({
    type: 'button',
    name: 'fontSize',
    label: "12", // no units
    tooltip: "Font size",
    overflowIcon: 'fa-text-height',
    hasCaret: true,
    isWide: true,
    command: "changeFontSize",
    style: {width: '90px'},
    preCommand(self, argument) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
        self.inlineTextInputVisible = self.inlineTextInputVisible ? false : true;
        setTimeout(() => {
            const input = document.querySelector('#inlineTextInput-fontSize');
            if (input) input.focus();
        });

        // from text input
        if (!argument) return;

        const value = argument;
        let sanitizedValue = sanitizeNumber(value, 12);
        if (sanitizedValue < 8) sanitizedValue = 8;
        if (sanitizedValue > 96) sanitizedValue = 96;

        // no units
        const label = String(sanitizedValue);
        self.label = label;

        return {
            value: sanitizedValue,
            label
        }
    },
    onTextMarkSelection(self, mark) {
        console.log('onTextMarkSelection', mark);
        self.label = mark.attrs.fontSize;
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.label = '12pt';
    }
});

const fontSizeOptions = ToolbarItem({
    type: 'options',
    name: 'fontSizeDropdown',
    command: 'changeFontSize',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.parentItem.inlineTextInputVisible = false;

        const {label} = argument;
        self.parentItem.label = label;
    },
})
fontSize.childItem = fontSizeOptions;
fontSizeOptions.parentItem = fontSize;

// separator
const separator =  ToolbarItem({
    type: 'separator',
    name: 'separator',
    icon: 'fa-grip-lines-vertical',
    isNarrow: true,
})

// italic
const italic = ToolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: "Italic",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'italic';
    }
});

// underline
const underline = ToolbarItem({
    type: 'button',
    name: 'underline',
    command: 'toggleUnderline',
    icon: 'fa fa-underline',
    active: false,
    tooltip: "Underline",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'underline';
    }
});

// color
const colorButton = ToolbarItem({
    type: 'button',
    name: 'color',
    icon: 'fa-font',
    overflowIcon: 'fa-palette',
    active: false,
    tooltip: "Text color",
    preCommand(self) {
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
        self.iconColor = mark.attrs.color;
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.iconColor = '#47484a';
    },
});
const colorOptions = ToolbarItem({
    name: 'colorOptions',
    type: 'options',
    command: 'toggleColor',
    preCommand(self) {
        self.active = false;
        self.parentItem.active = false;
    }
});
colorButton.childItem = colorOptions;
colorOptions.parentItem = colorButton;

// link
const link = ToolbarItem({
    type: 'button',
    name: 'link',
    icon: 'fa-link',
    active: false,
    tooltip: "Link",
        preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
        console.log('mark', mark);
        self.childItem.argument = {
            href: mark.attrs.href,
            text: mark.attrs.text,
        }
        self.active = true;
        self.childItem.active = true;
    },
    onTextSelectionChange(self, selectionText = null) {
        // if (selectionText) {
        //     console.log('selectionText', selectionText);
        //     self.argument = {
        //         href: '',
        //         text: selectionText,
        //     }
        // }
        self.active = false;
        self.childItem.active = false;
    },
});

const linkInput = ToolbarItem({
    type: 'options',
    name: 'linkInput',
    command: 'toggleLink',
    preCommand(self) {
        self.active = false;
        self.parentItem.active = false;
    },
    active: false,
});
link.childItem = linkInput;
linkInput.parentItem = link;

// image
const image = ToolbarItem({
    type: 'button',
    name: 'image',
    command: 'toggleImage',
    icon: 'fa-image',
    active: false,
    tooltip: "Image",
    disabled: true,
});

// alignment
const alignment = ToolbarItem({
    type: 'button',
    name: 'textAlign',
    tooltip: "Alignment",
    icon: "fa-align-left",
    hasCaret: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;

        self.icon
    },
    onTextMarkSelection(self, mark) {
        self.icon = `fa-align-${mark.attrs.alignment}`;
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.icon = 'fa-align-left';
    }
});

const alignmentOptions = ToolbarItem({
    type: 'options',
    name: 'alignmentOptions',
    command: 'changeTextAlignment',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.argument = argument;
    },
})
alignment.childItem = alignmentOptions;
alignmentOptions.parentItem = alignment;

// bullet list
const bulletedList = ToolbarItem({
    type: 'button',
    name: 'list',
    disabled: true,
    command: 'toggleList',
    icon: 'fa-list',
    active: false,
    tooltip: "Bullet list",
});

// number list
const numberedList = ToolbarItem({
    type: 'button',
    name: 'numberedlist',
    disabled: true,
    command: 'toggleNumberedList',
    icon: 'fa-list-numeric',
    active: false,
    tooltip: "Numbered list",
});

// indent left
const indentLeft = ToolbarItem({
    type: 'button',
    name: 'indentleft',
    command: 'toggleIndentLeft',
    icon: 'fa-indent',
    active: false,
    tooltip: "Left indent",
});

// indent right
const indentRight = ToolbarItem({
    type: 'button',
    name: 'indentright',
    command: 'changeTextIndent',
    icon: 'fa-indent',
    active: false,
    tooltip: "Right indent",
});

// overflow
const overflow = ToolbarItem({
    type: 'button',
    name: 'overflow',
    command: 'toggleOverflow',
    icon: 'fa-ellipsis-vertical',
    active: false,
    tooltip: "More options",

    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
    }
});

const overflowOptions = ToolbarItem({
    type: 'options',
    name: 'overflowOptions',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.argument = argument;
    },
})
overflow.childItem = overflowOptions;
overflowOptions.parentItem = overflow;

// zoom
const zoom = ToolbarItem({
    type: 'button',
    name: 'zoom',
    tooltip: "Zoom",
    overflowIcon: 'fa-magnifying-glass-plus',
    label: "100%",
    hasCaret: true,
    isWide: true,
    style: {width: '100px'},
    inlineTextInputVisible: false,
    preCommand(self, argument) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
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

        return {
            value: sanitizedValue,
            label
        }
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
    }
});

const zoomOptions = ToolbarItem({
    type: 'options',
    name: 'zoomDropdown',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.parentItem.inlineTextInputVisible = false;
        
        const editor = document.querySelector('.super-editor');
        const {value, label} = argument;
        self.parentItem.label = label;
        editor.style.zoom = value;
    },
})
zoom.childItem = zoomOptions;
zoomOptions.parentItem = zoom;

// undo
const undo = ToolbarItem({
    type: 'button',
    name: 'undo',
    tooltip: "Undo",
    command: "undo",
    icon: "fa-solid fa-rotate-left",
    // isNarrow: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
    }
});

// redo
const redo = ToolbarItem({
    type: 'button',
    name: 'redo',
    tooltip: "Redo",
    command: "redo",
    icon: 'fa fa-rotate-right',
    // isNarrow: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
    }
});

// search
const search = ToolbarItem({
    type: 'button',
    name: 'search',
    tooltip: "Search",
    disabled: true,
    icon: "fa-solid fa-magnifying-glass",
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
    }
});

const searchOptions = ToolbarItem({
    type: 'options',
    name: 'searchDropdown',
    command: 'search',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.argument = argument;
    },
})
search.childItem = searchOptions;
searchOptions.parentItem = search;

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
  indentRight,
  indentLeft,
  separator,
  search,
  overflow,
  // suggesting
  // TODO: Restore this later - removing for initial milestone
  // ToolbarItem({
  //   type: 'toggle',
  //   label: 'Suggesting',
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
      label: item.name,
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

const alignments = [
  [
    {label: 'Left', icon: 'fa-align-left', value: 'left'},
    {label: 'Center', icon: 'fa-align-center', value: 'center'},
    {label: 'Right', icon: 'fa-align-right', value: 'right'},
    {label: 'Justify', icon: 'fa-align-justify', value: 'justify'},
  ]
]

const makeColorOption = (label, color) => {
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

const colors = [
  [
    makeColorOption('Red', 'red'),
    makeColorOption('Blue', 'blue'),
    makeColorOption('Green', 'green')
  ],
  [
    makeColorOption('Yellow', 'yellow'),
    makeColorOption('Purple', 'purple'),
    makeColorOption('Orange', 'orange')
  ],
  [
    makeColorOption('Black', 'black'),
    makeColorOption('White', 'white'),
    makeColorOption('Gray', 'gray')
  ],
  [
    makeColorOption('Pink', 'pink'),
    makeColorOption('Brown', 'brown'),
    makeColorOption('Cyan', 'cyan')
  ],
]

// no units
const fontSizeValues = [
  {label: '8', value: 8},
  {label: '9', value: 9},
  {label: '10', value: 10},
  {label: '11', value: 11},
  {label: '12', value: 12},
  {label: '14', value: 14},
  {label: '18', value: 18},
  {label: '24', value: 24},
  {label: '30', value: 30},
  {label: '36', value: 36},
  {label: '48', value: 48},
  {label: '60', value: 60},
  {label: '72', value: 72},
  {label: '96', value: 96}
]

const zoomValues = [
  {label: '50%', value: 0.5},
  {label: '75%', value: 0.75},
  {label: '90%', value: 0.9},
  {label: '100%', value: 1},
  {label: '125%', value: 1.25},
  {label: '150%', value: 1.5},
  {label: '200%', value: 2},
]

const fonts = [
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
        options: [
          { label: 'Regular', fontWeight: 400 },
          { label: 'Bold', fontWeight: 700 },
        ],
      },
      {
        label: 'Times New Roman',
        fontName: 'Times New Roman, serif',
        fontWeight: 400,
      },
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
  const {preCommand, command} = item;

  if (preCommand) {
    console.log("Calling precommand", item, argument)
    const preCommandResult = preCommand(item, argument);
    if (preCommandResult) argument = preCommandResult;
    console.log("Precommand result", preCommandResult)
  }

  if (command) {
    console.log("Executing command", command, argument)
    emit('command', {command, argument});
  }
}

const handleToolbarButtonClick = (item, argument = null) => {
  executeItemCommands(item, argument);
}

const handleToolbarButtonTextSubmit = (item, argument) => {
  executeItemCommands(item, argument);
}

const onTextSelectionChange = (marks, selectionText = null) => {
  toolbarItems.value.forEach((item) => {
    if (item.onTextSelectionChange) {
      item.onTextSelectionChange(item, selectionText);
    }

    // handle selection
    const correspondingMark = marks.find((mark) => mark.type.name === item.name);
    if (correspondingMark && item.onTextMarkSelection) {
      item.onTextMarkSelection(item, correspondingMark);
    }
  });
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
        :active="item.active"
        :tooltip="item.tooltip"
        :tooltip-visible="item.tooltipVisible"
        :name="item.name"
        :icon="item.icon"
        :label="item.label"
        :has-caret="item.hasCaret"
        :inline-text-input-visible="item.inlineTextInputVisible"
        :icon-color="item.iconColor"
        :has-icon="hasIcon(item)"
        @mouseenter="handleButtonMouseEnter(item)"
        @mouseleave="handleButtonMouseLeave(item)"
        @textSubmit="(argument) => handleToolbarButtonTextSubmit(item, argument)"
        @buttonClick="handleToolbarButtonClick(item)">

          <!-- font dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontFamilyDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="fonts"/>

          <!-- zoom dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'zoomDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="zoomValues"/>
          
          <!-- font size dropdown -->
          <DropdownOptions
            v-if="showOptions(item.childItem, 'fontSizeDropdown')"
            :command="item.childItem.command"
            @optionClick="(option) => handleToolbarButtonClick(item.childItem, option)"
            :options="fontSizeValues"/>

          <!-- color picker  -->
          <IconGrid
            v-if="showOptions(item.childItem, 'colorOptions')"
            :icons="colors"
            @select="(color) => handleToolbarButtonClick(item.childItem, color)"/>

          <!-- alignment options  -->
          <IconGrid
          v-if="showOptions(item.childItem, 'alignmentOptions')"
          :icons="alignments"
          @select="(alignment) => handleToolbarButtonClick(item.childItem, alignment)"/>

          <!-- link input -->
          <LinkInput v-if="showOptions(item.childItem, 'linkInput')"
          :initial-url="item.childItem.argument?.href || ''"
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
  width: 6%;
  margin: 0 1%;
}
</style>