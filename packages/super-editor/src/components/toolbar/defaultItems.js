import { ToolbarItem } from '@/components/toolbar/ToolbarItem';
import { sanitizeNumber } from '@/components/toolbar/helpers';
import { undoDepth, redoDepth } from 'prosemirror-history';
import { getMarksFromSelection } from '@helpers/getMarksFromSelection.js';
import { computed } from 'vue';

// toolbar
export const makeDefaultItems = (activeEditor) => {
    // bold
    const bold = new ToolbarItem({
        type: 'button',
        name: 'bold',
        command: 'toggleBold',
        icon: 'fa fa-bold',
        tooltip: "Bold",
    });

    // font
    const fontButton = new ToolbarItem({
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
        style: { width: '120px' },
        preCommand(self, argument) {
            if (!argument) return;
            self.label = argument.label;
        }
    });

    const fontOptions = new ToolbarItem({
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
    const fontSize = new ToolbarItem({
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
        style: { width: '90px' },
        options: [
            { label: '8', value: '8pt' },
            { label: '9', value: '9pt' },
            { label: '10', value: '10pt' },
            { label: '11', value: '11pt' },
            { label: '12', value: '12pt' },
            { label: '14', value: '14pt' },
            { label: '18', value: '18pt' },
            { label: '24', value: '24pt' },
            { label: '30', value: '30pt' },
            { label: '36', value: '36pt' },
            { label: '48', value: '48pt' },
            { label: '60', value: '60pt' },
            { label: '72', value: '72pt' },
            { label: '96', value: '96pt' },
        ],
        preCommand(self) {
            self.inlineTextInputVisible = self.inlineTextInputVisible ? false : true;
            setTimeout(() => {
                const input = document.querySelector('#inlineTextInput-fontSize');
                if (input) input.focus();
            });
        },
        getActiveLabel(self) {
            let label = self._getActiveLabel(activeEditor) || self.defaultLabel;
            let sanitizedValue = sanitizeNumber(label, 12);
            if (sanitizedValue < 8) sanitizedValue = 8;
            if (sanitizedValue > 96) sanitizedValue = 96;

            // no units
            label = String(sanitizedValue);

            return label;
        }
    });

    const fontSizeOptions = new ToolbarItem({
        type: 'options',
        name: 'fontSizeDropdown',
        command: 'setFontSize',
        preCommand(self, argument) {
            self.parentItem.inlineTextInputVisible = false;

            const { label } = argument;
            self.parentItem.label = label;
        },
    })
    fontSize.childItem = fontSizeOptions;
    fontSizeOptions.parentItem = fontSize;

    // separator
    const separator = new ToolbarItem({
        type: 'separator',
        name: 'separator',
        icon: 'fa-grip-lines-vertical',
        isNarrow: true,
    })

    // italic
    const italic = new ToolbarItem({
        type: 'button',
        name: 'italic',
        command: 'toggleItalic',
        icon: 'fa fa-italic',
        active: false,
        tooltip: "Italic"
    });

    // underline
    const underline = new ToolbarItem({
        type: 'button',
        name: 'underline',
        command: 'toggleUnderline',
        icon: 'fa fa-underline',
        active: false,
        tooltip: "Underline",
    });

    // color
    const colorButton = new ToolbarItem({
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
    const colorOptions = new ToolbarItem({
        name: 'colorOptions',
        type: 'options',
        preCommand(self) {
            self.parentItem.active = false;
        },
        options: [
            [
                makeColorOption('#111', 'Black'),
                makeColorOption('#333', 'Darker Grey'),
                makeColorOption('##5C5C5C', 'Dark Grey',),
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
    const link = new ToolbarItem({
        type: 'button',
        name: 'link',
        markName: 'link',
        command: 'toggleLink',
        preCommand(self) {
            const marks = getMarksFromSelection(activeEditor.view.state);
            const mark = marks.find(mark => mark.type.name === 'link') || null;
            if (mark) self.childItem.active = false;
        },
        icon: 'fa-link',
        active: false,
        tooltip: "Link"
    });

    const linkInput = new ToolbarItem({
        type: 'options',
        name: 'linkInput',
        command: 'toggleLink',
        active: false,
    });
    link.childItem = linkInput;
    linkInput.parentItem = link;

    // image
    const image = new ToolbarItem({
        type: 'button',
        name: 'image',
        command: 'toggleImage',
        icon: 'fa-image',
        active: false,
        tooltip: "Image",
        disabled: true,
    });

    // alignment
    const alignment = new ToolbarItem({
        type: 'button',
        name: 'textAlign',
        tooltip: "Alignment",
        icon: "fa-align-left",
        hasCaret: true,
        markName: 'textAlign',
        labelAttr: 'textAlign',
        getIcon(self) {
            let alignment = self.getAttr(activeEditor, 'textAlign');
            if (!alignment) alignment = 'left';
            return `fa-align-${alignment}`;
        }
    });

    const alignmentOptions = new ToolbarItem({
        type: 'options',
        name: 'alignmentOptions',
        command: 'setTextAlign',
        options: [
            [
                { defaultLabel: 'Left', icon: 'fa-align-left', value: 'left' },
                { defaultLabel: 'Center', icon: 'fa-align-center', value: 'center' },
                { defaultLabel: 'Right', icon: 'fa-align-right', value: 'right' },
                { defaultLabel: 'Justify', icon: 'fa-align-justify', value: 'justify' }
            ]
        ]
    })
    alignment.childItem = alignmentOptions;
    alignmentOptions.parentItem = alignment;

    // bullet list
    const bulletedList = new ToolbarItem({
        type: 'button',
        name: 'list',
        command: 'toggleBulletList',
        icon: 'fa-list',
        active: false,
        tooltip: "Bullet list",
    });

    // number list
    const numberedList = new ToolbarItem({
        type: 'button',
        name: 'numberedlist',
        command: 'toggleOrderedList',
        icon: 'fa-list-numeric',
        active: false,
        tooltip: "Numbered list",
    });

    // indent left
    const indentLeft = new ToolbarItem({
        type: 'button',
        name: 'indentleft',
        command: 'decreaseTextIndent',
        icon: 'fa-indent',
        active: false,
        tooltip: "Left indent",
        disabled: false
    });

    // indent right
    const indentRight = new ToolbarItem({
        type: 'button',
        name: 'indentright',
        command: 'increaseTextIndent',
        icon: 'fa-indent',
        active: false,
        tooltip: "Right indent",
        disabled: false
    });

    // overflow
    const overflow = new ToolbarItem({
        type: 'button',
        name: 'overflow',
        command: 'toggleOverflow',
        icon: 'fa-ellipsis-vertical',
        active: false,
        tooltip: "More options",
        disabled: true
    });

    const overflowOptions = new ToolbarItem({
        type: 'options',
        name: 'overflowOptions',
        preCommand(self, argument) {
            self.parentItem.active = false;
        },
    })
    overflow.childItem = overflowOptions;
    overflowOptions.parentItem = overflow;

    // zoom
    const zoom = new ToolbarItem({
        type: 'button',
        name: 'zoom',
        tooltip: "Zoom",
        overflowIcon: 'fa-magnifying-glass-plus',
        defaultLabel: "100%",
        hasCaret: true,
        isWide: true,
        style: { width: '100px' },
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

            const label = String(sanitizedValue) + '%';
            self.label = label;
            editor.style.zoom = sanitizedValue / 100;

            return sanitizedValue
        }
    });

    const zoomOptions = new ToolbarItem({
        type: 'options',
        name: 'zoomDropdown',
        preCommand(self, argument) {
            self.parentItem.active = false;
            self.parentItem.inlineTextInputVisible = false;

            const editor = document.querySelector('.super-editor');
            const { value, label } = argument;
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
    const undo = new ToolbarItem({
        type: 'button',
        disabled: true,
        name: 'undo',
        disabled: true,
        tooltip: "Undo",
        command: "undo",
        icon: "fa-solid fa-rotate-left"
    });

    // redo
    const redo = new ToolbarItem({
        type: 'button',
        disabled: true,
        name: 'redo',
        disabled: true,
        tooltip: "Redo",
        command: "redo",
        icon: 'fa fa-rotate-right'
    });

    // search
    const search = new ToolbarItem({
        type: 'button',
        name: 'search',
        tooltip: "Search",
        disabled: true,
        icon: "fa-solid fa-magnifying-glass"
    });

    const searchOptions = new ToolbarItem({
        type: 'options',
        name: 'searchDropdown',
        command: 'search'
    })
    search.childItem = searchOptions;
    searchOptions.parentItem = search;

    const clearFormatting = new ToolbarItem({
        type: 'button',
        name: 'clearFormatting',
        command: 'clearFormat',
        tooltip: "Clear formatting",
        icon: 'fa-text-slash'
    });

    const toolbarItemsMobile = [
        bold,
        italic,
        underline,
        indentRight,
        indentLeft,
        search,
        overflow
    ].map((item) => item.name)

    const toolbarItemsTablet = [
        ...toolbarItemsMobile,
        ...[
            fontButton,
            fontSize,
            alignment,
            bulletedList,
            numberedList,
            overflow
        ].map((item) => item.name)
    ]

    let overflowItems = [];

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
        toolbarItems.forEach(item => {
            if (!toolbarItemsBreakpoint.includes(item.name) && item.type !== 'separator') {
                items.push(item);
            }
        })

        overflowItems = items;
        console.log("Overflow items", overflowItems)
    };

    const overflowIconGrid = computed(() => [overflowItems.map((item) => (
        {
            defaultLabel: item.name,
            icon: item.overflowIcon || null,
            value: 'test'
        }
    ))]);
    const toolbarItems = [
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
        // new ToolbarItem({
        //   type: 'toggle',
        //   defaultLabel: 'Suggesting',
        //   name: 'suggesting',
        //   command: null,
        //   icon: null,
        //   active: false,
        //   tooltip: "Suggesting",
        // }),
    ]

    const desktopExclude = ['overflow'];
    const toolbarItemsDesktop = toolbarItems.map((item) => item.name).filter((name) => !desktopExclude.includes(name));

    const mobileBreakpoint = (item) => toolbarItemsMobile.includes(item.name);
    const tabletBreakpoint = (item) => toolbarItemsTablet.includes(item.name);
    const desktopBreakpoint = (item) => toolbarItemsDesktop.includes(item.name);

    toolbarItems.forEach((item) => {
        item.isMobile = mobileBreakpoint(item);
        item.isTablet = tabletBreakpoint(item);
        item.isDesktop = desktopBreakpoint(item);
    })

    return toolbarItems;
};

export const setHistoryButtonStateOnUpdate = (toolbarItemsRef) => ({ editor, transaction }) => {
    console.log("TOOLBAR", toolbarItemsRef)
    console.debug('[SuperEditor dev] Document updated', editor);
    // activeEditor = editor;

    const undo = toolbarItemsRef.value.find(item => item.name === 'undo');
    const redo = toolbarItemsRef.value.find(item => item.name === 'redo');

    undo.disabled = undoDepth(editor.state) <= 0;
    redo.disabled = redoDepth(editor.state) <= 0;
}