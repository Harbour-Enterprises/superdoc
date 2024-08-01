function inchesToTwips(inches) {
  if (inches instanceof String || typeof inches === 'string') inches = parseFloat(inches)
  return inches * 1440;
}

function twipsToInches(twips) {
  if (twips instanceof String || typeof inches === 'string') twips = int(twips)
  return twips / 1440;
}

function twipsToPixels(twips) {
  twips = twipsToInches(twips);
  return twips * 96;
}

export { inchesToTwips, twipsToInches, twipsToPixels };