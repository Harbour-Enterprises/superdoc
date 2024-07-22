import ToolbarItem from "../ToolbarItem";

const link = ToolbarItem({
    type: 'button',
    name: 'link',
    icon: 'fa-link',
    active: false,
    tooltip: "Link",
    preCommand(self) {
        clearTimeout(self.tooltipTimeout);
        self.tooltipVisible = false;
        self.active = self.active ? false : true;
        self.childItem.active = self.childItem.active ? false : true;
    },
    onTextMarkSelection(self, mark) {
        console.log('mark', mark);
        self.childItem.argument = {
            href: mark.attrs.href,
            text: mark.attrs.text,
        }
        self.active = true;
        self.childItem.active = true;
    },
    onTextSelectionChange(self, selectionText = null) {
        // if (selectionText) {
        //     console.log('selectionText', selectionText);
        //     self.argument = {
        //         href: '',
        //         text: selectionText,
        //     }
        // }
        self.active = false;
        self.childItem.active = false;
    },
});

const linkInput = ToolbarItem({
    type: 'options',
    name: 'linkInput',
    command: 'toggleLink',
    preCommand(self) {
        self.active = false;
        self.parentItem.active = false;
    },
    active: false,
    // argument: {
    //     href: '',
    //     text: '',
    // },
});

link.childItem = linkInput;
linkInput.parentItem = link;

export default link;