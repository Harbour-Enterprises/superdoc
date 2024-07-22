import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'fontSize',
    label: "12pt",
    tooltip: "Font size",
    hasCaret: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
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

        const {label} = argument;
        self.parentItem.label = label;
    },
})
button.childItem = buttonOptions;
buttonOptions.parentItem = button;

export default button;