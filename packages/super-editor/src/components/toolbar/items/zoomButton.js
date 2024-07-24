import ToolbarItem from "../ToolbarItem";
import { sanitizeNumber } from "../helpers";

const name = 'zoom';

const zoomButton = ToolbarItem({
    type: 'button',
    name,
    tooltip: "Zoom",
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
            const input = document.querySelector(`#inlineTextInput-${name}`);
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
zoomButton.childItem = zoomOptions;
zoomOptions.parentItem = zoomButton;

export default zoomButton;