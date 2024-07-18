import ToolbarItem from "../ToolbarItem";

const bold = ToolbarItem({
    type: 'button',
    name: 'bold',
    command: 'toggleBold',
    icon: 'fa fa-bold',
    tooltip: "Bold",
    onSelectionChange(self) {
        self.active = false;
    },
    onMarkSelection(self, mark) {
        self.active = mark.type.name == 'bold';
    }
});

export default bold