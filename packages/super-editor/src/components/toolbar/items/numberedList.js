import ToolbarItem from "../ToolbarItem";

const numberedList = ToolbarItem({
    type: 'button',
    name: 'numberedlist',
    disabled: true,
    command: 'toggleNumberedList',
    icon: 'fa-list-numeric',
    active: false,
    tooltip: "Numbered list",
});

export default numberedList;