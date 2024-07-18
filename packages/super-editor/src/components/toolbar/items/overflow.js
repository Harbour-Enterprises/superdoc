import ToolbarItem from "../ToolbarItem";

const overflow = ToolbarItem({
    type: 'button',
    name: 'overflow',
    command: 'toggleOverflow',
    icon: 'fa-ellipsis-vertical',
    active: false,
    tooltip: "More options",
});

export default overflow;