import ToolbarItem from "../ToolbarItem";

const paragraph = ToolbarItem({
    type: 'button',
    name: 'paragraph',
    command: 'toggleParagraph',
    icon: 'fa-align-left',
    active: false,
    tooltip: "Paragraph",
});

export default paragraph;