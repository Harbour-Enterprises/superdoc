import ToolbarItem from "../ToolbarItem";

const zoomButton = ToolbarItem({
    type: 'button',
    name: 'zoom',
    tooltip: "Zoom",
    label: "Zoom",
    hasCaret: true,
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

const zoomOptions = ToolbarItem({
    type: 'options',
    name: 'zoomDropdown',
    command: 'toggleZoom',
    preCommand(self, argument) {
        console.log('preCommand', argument);
        self.active = false;
        self.parentItem.active = false;
        self.argument = argument;
    },
})
zoomButton.childItem = zoomOptions;
zoomOptions.parentItem = zoomButton;

export default zoomButton;