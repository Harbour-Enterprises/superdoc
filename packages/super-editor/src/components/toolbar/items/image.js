import ToolbarItem from "../ToolbarItem";

const image = ToolbarItem({
    type: 'button',
    name: 'image',
    command: 'toggleImage',
    icon: 'fa-image',
    active: false,
    tooltip: "Image",
    disabled: true,
});

export default image;