import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'alignment',
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
    },
    onTextSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
    }
});

const buttonOptions = ToolbarItem({
    type: 'options',
    name: 'alignmentOptions',
    command: '_command',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.argument = argument;
    },
})
button.childItem = buttonOptions;
buttonOptions.parentItem = button;

export default button;