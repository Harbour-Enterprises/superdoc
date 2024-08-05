
export class ToolbarItem {
    init(options) {
        // required
        const types = ['button', 'options', 'separator'];
        if (!types.includes(options.type)) {
            throw new Error('Invalid toolbar item type - ' + options.type);
        }

        if (!options.name) {
            throw new Error('Invalid toolbar item name - ' + options.name);
        }

        if (!options.editor) {
            throw new Error('Invalid toolbar item editor - ' + options.editor);
        }

        this.type = options.type
        this.name = options.name
        this.editor = options.editor

        // nested options
        this.options = []
        if (options.options) {
            if (!Array.isArray(options.options)) throw new Error('Invalid toolbar item options - ' + options.options);
            this.options = options.options
        }

        // top-level style
        this.style = null
        this.isNarrow = false
        this.isWide = false

        // handlers
        this.onTextMarkSelection = this._onTextMarkSelection
        this.onTextSelectionChange = this._onTextSelectionChange
        this.preCommand = this._preCommand
        this.getLabel = this._getLabel
        this.getIconColor = this._getIconColor

        this.command = null
        this.argument = null
        this.childItem = null
        this.parentItem = null
        this.active = false

        // icon properties
        this.icon = null
        this.overflowIcon = null
        this.iconColor = null
        this.hasCaret = false

        // tooltip properties
        this.tooltip = null
        this.tooltipVisible = false
        this.tooltipTimeout = null

        // behavior
        this.defaultLabel = null
        this.hideLabel = false
        this.disabled = false
        this.inlineTextInputVisible = false
        this.hasInlineTextInput = false

        // mark
        this.markName = null
        this.labelAttr = null

        const handlers = ['onTextMarkSelection', 'onTextSelectionChange', 'preCommand', 'getAttr', 'getLabel', 'getIconColor'];
        Object.keys(options).forEach(key => {
            if (!this.hasOwnProperty(key)) throw new Error('Invalid toolbar item property - ' + key);
            // handler assignment
            if (handlers.includes(key)) {
                if (typeof options[key] !== 'function') throw new Error('Invalid toolbar item handler - ' + key);
                this[key] = function(...args){
                    this[`_${key}`]()
                    return options[key](this, ...args) // callback
                }
                return;
            }
            this[key] = options[key]
        });
    }

    constructor(options = {}) {
        this.init(options)
    }

    // handlers
    _getAttr(attr) {
        if (!this.markName || !attr) return null;
        return this.editor.getAttributes(this.markName)[attr];
    }
    _getLabel() {
        return this._getAttr(this.labelAttr) || this.defaultLabel;
    }
    _getIconColor() {
        return this._getAttr('color') || this.iconColor;
    }
    _onTextMarkSelection() {}
    _onTextSelectionChange() {
        this.active = false;
        if (this.childItem) this.childItem.active = false;
    }
    _preCommand() {
        clearTimeout(this.tooltipTimeout);
        this.tooltipVisible = false;
        this.active = this.active ? false : true;
        if (this.childItem) this.childItem.active = this.childItem.active ? false : true;
    }
}
