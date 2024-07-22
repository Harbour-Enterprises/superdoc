import ToolbarItem from "../ToolbarItem";

const bold = ToolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    tooltip: "Bold",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'bold';
    }
});

export default bold