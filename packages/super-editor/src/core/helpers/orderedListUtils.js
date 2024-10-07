export const generateOrderedListIndex = ({ listLevel, lvlText, listNumberingType }) => {
  const handler = listIndexMap[listNumberingType];
  return handler ? handler(listLevel, lvlText) : null;
};

const handleDecimal = (path, lvlText) => generateNumbering(path, lvlText, String);
const handleRoman = (path, lvlText) => generateNumbering(path, lvlText, intToRoman);
const handleLowerRoman = (path, lvlText) => handleRoman(path, lvlText).toLowerCase();
const handleLowerAlpha = (path, lvlText) => handleAlpha(path, lvlText).toLowerCase();
const handleAlpha = (path, lvlText) => generateNumbering(path, lvlText, (p) => intToAlpha(p));

const listIndexMap = {
  decimal: handleDecimal,
  lowerRoman: handleLowerRoman,
  upperRoman: handleRoman,
  lowerLetter: handleLowerAlpha,
  upperLetter: handleAlpha,
};

const createNumbering = (values, lvlText) => {
  return values.reduce((acc, value, index) => {
    return acc.replace(`%${index + 1}`, value);
  }, lvlText);
};

const generateNumbering = (path, lvlText, formatter) => {
  const formattedValues = path.map(formatter);
  return createNumbering(formattedValues, lvlText);
};

/**
 * Convert a number to a roman numeral
 * @param {Integer} num 
 * @returns {String}
 */
const intToRoman = (num) => {
  const romanNumeralMap = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
  ];

  let result = '';
  for (const { value, numeral } of romanNumeralMap) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
};

/**
 * Convert a number to an alphabetic character
 * @param {Integer} num
 * @returns {String}
 */
const intToAlpha = (num) => {
  let result = '';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (num > 0) {
      let index = (num - 1) % 26;
      result = alphabet[index] + result;
      num = Math.floor((num - 1) / 26);
  }
  return result;
}