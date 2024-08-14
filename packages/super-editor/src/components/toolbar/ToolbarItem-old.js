
export class ToolbarItem {
    init(options) {
        // required
        const types = ['button', 'options', 'separator'];
        if (!types.includes(options.type)) {
            throw new Error('Invalid toolbar item type - ' + options.type);
        }

        if (
            options.type === 'button' && 
            !options.defaultLabel &&
            !options.icon
        ) {
            throw new Error('Toolbar button item needs either icon or label - ' + options.name);
        }

        if (!options.name) {
            throw new Error('Invalid toolbar item name - ' + options.name);
        }

        this.type = options.type
        this.name = options.name
        this.group = options.group || 'center'

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
        this.label = null;
        this.hideLabel = false
        this.disabled = false
        this.inlineTextInputVisible = false
        this.hasInlineTextInput = false
        this.isMobile = true
        this.isTablet = true
        this.isDesktop = true

        // mark
        this.markName = null
        this.labelAttr = null

        const handlers = [
            'onTextMarkSelection',
            'onTextSelectionChange',
            'preCommand',
            'getAttr',
            'getActiveLabel',
            'getIconColor',
            'getActiveState',
            'getIcon',
            'activate'
        ];

        // // set default handlers
        // handlers.forEach(handler => this[handler] = this[`_${handler}`]);

        // // set custom properties
        // Object.keys(options).forEach(key => {
        //     if (!this.hasOwnProperty(key)) throw new Error('Invalid toolbar item property - ' + key);
        //     // set custom handlers
        //     if (handlers.includes(key)) {
        //         if (typeof options[key] !== 'function') throw new Error('Invalid toolbar item handler - ' + key);

        //         console.debug('\n\n HANDLER', this, key, '\n\n')
        //         this[key] = function(...args){
        //             this[`_${key}`](...args)
        //             return options[key](this, ...args) // callback
        //         }
        //         return;
        //     }
        //     this[key] = options[key]
        // });
    }

    constructor(options = {}) {
        this.init(options)
    }

    activate() {
        console.debug('activate', this);
    }

    // handlers
    _getActiveState(editorInstance = null) {
        return true;
        if (!editorInstance) throw new Error('Editor instance is required to get active state');
        return editorInstance.isActive(this.name)
    }
    _getAttr() {
        return 'ok'
        // if (!editorInstance) throw new Error('Editor instance is required to get attribute '+attr);
        // if (!this.markName || !attr) return null;
        // return editorInstance.getAttributes(this.markName)[attr];
    }
    _getActiveLabel() {
        console.debug('getActiveLabel', this);
        return this._getAttr() || null;
    }
    _getIconColor(editorInstance = null) {
        return '#ff0000';
        return this._getAttr(editorInstance, 'color') || null;
    }

    _getIcon() {
        return this.icon || null;
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
