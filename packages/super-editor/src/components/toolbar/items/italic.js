import ToolbarItem from "../ToolbarItem";

const italic = ToolbarItem({
    type: 'button',
    name: 'italic',
    command: 'toggleItalic',
    icon: 'fa fa-italic',
    active: false,
    tooltip: "Italic",
    onTextSelectionChange(self) {
        self.active = false;
    },
    onTextMarkSelection(self, mark) {
        self.active = mark.type.name == 'italic';
    }
});

export default italic;