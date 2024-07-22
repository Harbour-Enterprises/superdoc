
export default (options) => {
    const types = ['button', 'options', 'separator'];
    if (!types.includes(options.type)) {
        console.error('Invalid toolbar item type:',options.type);
        return;
    }
    return {
        type: options.type,
        name: options.name,

        // handlers
        onMarkSelection: options.onMarkSelection || null,
        onSelectionChange: options.onSelectionChange || null,
        preCommand: options.preCommand || null,
        postCommand: options.postCommand || null,

        command: options.command || null,
        argument: options.argument || null,
        childItem: options.childItem || null,
        parentItem: options.parentItem || null,
        active: options.active || false,

        // icon properties
        icon: options.icon || null,
        iconColor: options.iconColor || null,
        hasCaret: options.hasCaret || false,

        // tooltip properties
        tooltip: options.tooltip || null,
        tooltipVisible: options.tooltipVisible || false,
        tooltipTimeout: options.tooltipTimeout || null,

        // behavior
        label: options.label || null,
        disabled: options.disabled || false,
        inlineTextInputVisible: options.inlineTextInputVisible || false,
    }
}
