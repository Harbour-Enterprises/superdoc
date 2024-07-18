import ToolbarItem from "../ToolbarItem";

const italic = ToolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: "Italic",
    onSelectionChange(self) {
        self.active = false;
    },
    onMarkSelection(self, mark) {
        self.active = mark.type.name == 'italic';
    }
});

export default italic;