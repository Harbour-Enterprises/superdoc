/**
 * Parse format list from string.
 * @param {string} str
 * @returns {Array} Array ({ type, attrs })
 */
export const parseFormatList = (str) => {
  if (!str) return [];
  let formatList;
  try {
    formatList = JSON.parse(str);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(formatList)) {
    return [];
  }
  return formatList.filter(
    (format) => Object.hasOwn(format, 'type') && Object.hasOwn(format, 'attrs'),
  );
};
