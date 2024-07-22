import ToolbarItem from "../ToolbarItem";

const sanitizeZoom = (value) => {
    // remove non-numeric characters
    let sanitized = value.replace(/[^0-9.]/g, '');
    // convert to number
    sanitized = parseFloat(sanitized);
    if (isNaN(sanitized)) sanitized = 100

    sanitized = parseFloat(sanitized);
    if (sanitized < 0) sanitized = 10;
    if (sanitized > 200) sanitized = 200;
    return sanitized;
};

const zoomButton = ToolbarItem({
    type: 'button',
    name: 'zoom',
    tooltip: "Zoom",
    label: "100%",
    hasCaret: true,
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
        const sanitizedValue = sanitizeZoom(value);
        self.label = String(sanitizedValue)+'%';
        editor.style.zoom = sanitizedValue/100;
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
zoomButton.childItem = zoomOptions;
zoomOptions.parentItem = zoomButton;

export default zoomButton;