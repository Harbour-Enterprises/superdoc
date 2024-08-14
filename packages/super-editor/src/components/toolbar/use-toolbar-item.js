import { ref } from 'vue';

export const useToolbarItem = (options) => {

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

  const type = options.type;
  const name = ref(options.name);
  const command = options.command;
  const icon = ref(options.icon);
  const group = ref(options.group || 'center');

  const disabled = ref(options.disabled);
  const active = ref(false);

  // top-level style
  const style = ref(options.style);
  const isNarrow = ref(options.isNarrow)
  const isWide = ref(options.isWide)
  const minWidth = ref(options.minWidth)

  const argument = ref(options.argument);
  const childItem = ref(null)
  const parentItem = ref(null)

  // icon properties
  const overflowIcon = ref(options.overflowIcon)
  const iconColor = ref(options.iconColor)
  const hasCaret = ref(options.hasCaret)

  // tooltip properties
  const tooltip = ref(options.tooltip);
  const tooltipVisible = ref(options.tooltipVisible)
  const tooltipTimeout = ref(options.tooltipTimeout)

  // behavior
  const defaultLabel = ref(options.defaultLabel);
  const label = ref(options.label);
  const hideLabel = ref(options.hideLabel);
  const inlineTextInputVisible = ref(options.inlineTextInputVisible)
  const hasInlineTextInput = ref(options.hasInlineTextInput)
  const isMobile = ref(true)
  const isTablet = ref(true)
  const isDesktop = ref(true)

  const markName = ref(options.markName);
  const labelAttr = ref(options.labelAttr);

  const expand = ref(false);
  const nestedOptions = ref([]);
  if (options.options) {
    if (!Array.isArray(options.options)) throw new Error('Invalid toolbar item options - ' + options.options);
    nestedOptions.value.push(...options.options);
  }

  const updateState = (marks) => {
    console.debug('[super-toolbar] Updating state:', marks);
    const activeMark = marks.find(mark => mark.name === name.value);

    if (!activeMark) return _deactivate();
    _activate(activeMark);
  }

  const _deactivate = () => {
    active.value = false
  }
  const _activate = (activeMark) => {
    const { attrs } = activeMark || {};
    console.debug('[super-toolbar] Active mark:', attrs);
    active.value = true;
  }

  const unref = () => {
    const flattened = {};
    Object.keys(refs).forEach(key => {
      if (refs[key].value !== undefined) {
        flattened[key] = refs[key].value;
      }
    });
    return flattened;
  }

  const refs = {
    name,
    type,
    command,
    icon,
    tooltip,
    group,
    disabled,
    active,
    nestedOptions,
    expand,

    style,
    isNarrow,
    isWide,
    minWidth,
    argument,
    parentItem,
    overflowIcon,
    iconColor,
    hasCaret,
    tooltipVisible,
    tooltipTimeout,
    defaultLabel,
    label,
    hideLabel,
    disabled,
    inlineTextInputVisible,
    hasInlineTextInput,
    isMobile,
    isTablet,
    isDesktop,
    markName,
    labelAttr,
    childItem,
  }

  return {
    ...refs,
    updateState,
    unref,
  };
}