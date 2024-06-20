export function createStyleTag(style, suffix) {
  const hrbrStyleTag = document.querySelector(`style[data-supereditor-style${suffix ? `-${suffix}` : ''}]`);

  if (hrbrStyleTag !== null) {
    return hrbrStyleTag;
  }

  const styleNode = document.createElement('style');

  styleNode.setAttribute(`data-supereditor-style${suffix ? `-${suffix}` : ''}`, '');
  styleNode.innerHTML = style;
  document.getElementsByTagName('head')[0].appendChild(styleNode);

  return styleNode;
}
