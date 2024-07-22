import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'search',
    tooltip: "Search",
    icon: "fa-solid fa-magnifying-glass",
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onMarkSelection(self, mark) {
    },
    onSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
    }
});

const buttonOptions = ToolbarItem({
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
button.childItem = buttonOptions;
buttonOptions.parentItem = button;

export default button;