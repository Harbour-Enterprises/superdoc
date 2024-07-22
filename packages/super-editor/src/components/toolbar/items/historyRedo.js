import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'redo',
    tooltip: "Redo",
    command: "redo",
    icon: 'fa fa-rotate-right',
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
    },
    onMarkSelection(self, mark) {
    },
    onSelectionChange(self) {
        self.active = false;
    }
});

export default button;