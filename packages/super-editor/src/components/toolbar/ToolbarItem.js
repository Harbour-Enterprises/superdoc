
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

        this.type = options.type
        this.name = options.name

        // top-level style
        this.style = null
        this.isNarrow = false
        this.isWide = false

        // handlers
        this.onTextMarkSelection = this._onTextMarkSelection
        this.onTextSelectionChange = this._onTextSelectionChange
        this.preCommand = this._preCommand

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
        this.label = null
        this.disabled = false
        this.inlineTextInputVisible = false


        const handlers = ['onTextMarkSelection', 'onTextSelectionChange', 'preCommand'];
        Object.keys(options).forEach(key => {
            if (!this.hasOwnProperty(key)) throw new Error('Invalid toolbar item property - ' + key);
            // handler assignment
            if (handlers.includes(key)) {
                if (typeof options[key] !== 'function') throw new Error('Invalid toolbar item handler - ' + key);
                this[key] = function(...args){
                    this[`_${key}`]()
                    options[key](this, ...args) // callback
                }
                return;
            }
            this[key] = options[key]
        });
    }

    constructor(options = {}) {
        this.init(options)
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