import ToolbarItem from "../ToolbarItem";

const fontSize =  ToolbarItem({
    type: 'button',
    name: 'size',
    command: 'changeFontSize',
    icon: null,
    active: false,
    tooltip: "Font size",
    label: "12pt",
    argument: '12pt',
});

export default fontSize;