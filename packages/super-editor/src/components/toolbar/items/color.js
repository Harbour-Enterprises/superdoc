import ToolbarItem from "../ToolbarItem";

const colorButton = ToolbarItem({
    type: 'button',
    name: 'color',
    icon: 'fa fa-font',
    active: false,
    tooltip: "Text color",
    preCommand(self) {
        self.childItem.active = self.childItem.active ? false : true;
    },
    onMarkSelection(self, mark) {
        self.iconColor = mark.attrs.color;
    },
    onSelectionChange(self) {
        self.active = false;
        self.childItem.active = false;
        self.iconColor = '#47484a';
    },
});
const colorOptions = ToolbarItem({
    name: 'colorOptions',
    type: 'options',
    command: 'toggleColor',
    preCommand(self) {
        self.active = false;
        self.parentItem.active = false;
    }
});
colorButton.childItem = colorOptions;
colorOptions.parentItem = colorButton;

export default colorButton;