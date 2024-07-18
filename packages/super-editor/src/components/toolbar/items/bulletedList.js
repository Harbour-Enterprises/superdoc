import ToolbarItem from "../ToolbarItem";

const bulletedList = ToolbarItem({
    type: 'button',
    name: 'list',
    command: 'toggleList',
    icon: 'fa-list',
    active: false,
    tooltip: "Bullet list",
});

export default bulletedList;