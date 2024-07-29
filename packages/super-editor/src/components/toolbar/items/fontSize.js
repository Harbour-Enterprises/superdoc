import ToolbarItem from "../ToolbarItem";
import { sanitizeNumber } from "../helpers";

const name = 'fontSize';

const button = ToolbarItem({
    type: 'button',
    name,
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
            const input = document.querySelector(`#inlineTextInput-${name}`);
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

const buttonOptions = ToolbarItem({
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
button.childItem = buttonOptions;
buttonOptions.parentItem = button;

export default button;