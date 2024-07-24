import ToolbarItem from "../ToolbarItem";

const button = ToolbarItem({
    type: 'button',
    name: 'undo',
    tooltip: "Undo",
    command: "undo",
    icon: "fa-solid fa-rotate-left",
    // isNarrow: true,
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
    },
    onTextMarkSelection(self, mark) {
    },
    onTextSelectionChange(self) {
        self.active = false;
    }
});

export default button;