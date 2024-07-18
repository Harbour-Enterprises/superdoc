import ToolbarItem from "../ToolbarItem";

const fontButton = ToolbarItem({
    type: 'button',
    name: 'fontFamily',
    tooltip: "Font",
    label: "Font",
    hasCaret: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onMarkSelection(self, mark) {
        self.label = mark.attrs.font;
    },
    onSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.label = "Font";
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
        self.argument = argument;
    },
    command: 'toggleFont',
})
fontButton.childItem = fontOptions;
fontOptions.parentItem = fontButton;

export default fontButton;