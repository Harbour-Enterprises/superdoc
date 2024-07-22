import ToolbarItem from "../ToolbarItem";

const underline = ToolbarItem({
    type: 'button',
    name: 'underline',
    command: 'toggleUnderline',
    icon: 'fa fa-underline',
    active: false,
    tooltip: "Underline",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'underline';
    }
});

export default underline;