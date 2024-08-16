import { ref } from 'vue';

export const useToolbarItem = (options) => {

  const types = ['button', 'options', 'separator', 'select'];
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
  const attributes = ref(options.attributes || {});

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

  const nestedOptions = ref([]);
  if (options.options) {
    if (!Array.isArray(options.options)) throw new Error('Invalid toolbar item options - ' + options.options);
    nestedOptions.value.push(...options.options);
  }

  // Activation & Deactivation
  const textStyles = ['fontFamily', 'fontSize', 'color'];
  const textAttributes = ['textAlign']

  const updateState = (marks) => {
    const itemMarkName = name.value;
    let markName = itemMarkName;

    const isTextStyle = textStyles.includes(itemMarkName);
    if (isTextStyle) markName = 'textStyle';
    const activeMark = marks.find(mark => mark.name === markName);

    if (activeMark) {
      const { attrs } = activeMark || {};

      let attrValue = attrs[itemMarkName];
      if (itemMarkName === 'link') { 
        attrValue = attrs['href'];
        if (!attrValue) return _setActive(false);
      }

      const isAttribute = textAttributes.includes(itemMarkName);
      if (isTextStyle || isAttribute) {
        return onActivate(attrValue)
      } else {
        return _setActive(true, attrValue);
      }
  }

    // Deactivated by default
    _setActive(false);
  }

  // User can override this behavior
  const onActivate = options.onActivate || (() => null);
  const onDeactivate = options.onDeactivate || (() => null);

  const _setActive = (state, attributeValue = null) => {
    active.value = state;
    state ? onActivate(attributeValue) : onDeactivate();
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
    attributes,
    disabled,
    active,
    nestedOptions,

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
    onActivate,
    onDeactivate,
  };
}