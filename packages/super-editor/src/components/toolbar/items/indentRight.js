import ToolbarItem from "../ToolbarItem";

// indent right
const indentRight = ToolbarItem({
    type: 'button',
    name: 'indentright',
    command: 'toggleIndentRight',
    icon: 'fa-indent',
    active: false,
    tooltip: "Right indent",
});

export default indentRight;