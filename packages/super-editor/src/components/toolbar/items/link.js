import ToolbarItem from "../ToolbarItem";

const link = ToolbarItem({
    type: 'button',
    name: 'link',
    command: 'toggleLink',
    icon: 'fa-link',
    active: false,
    tooltip: "Link",
});

export default link;