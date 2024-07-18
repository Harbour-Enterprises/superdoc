import ToolbarItem from "../ToolbarItem";

const indentLeft = ToolbarItem({
    type: 'button',
    name: 'indentleft',
    command: 'toggleIndentLeft',
    icon: 'fa-indent',
    active: false,
    tooltip: "Left indent",
});

export default indentLeft;