import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'undo',
    tooltip: "Undo",
    command: "undoAction",
    icon: "fa-solid fa-rotate-left",
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

export default button;