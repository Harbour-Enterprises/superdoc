function inchesToTwips(inches) {
  if (inches instanceof String || typeof inches === 'string') inches = parseFloat(inches)
  return (inches * 1440).toFixed(2);
}

function twipsToInches(twips) {
  if (twips instanceof String || typeof inches === 'string') twips = int(twips)
  return (twips / 1440).toFixed(2);
}

function twipsToPixels(twips) {
  twips = twipsToInches(twips);
  return (twips * 96).toFixed(2);
}

function halfPointToPixels(halfPoints) {
  return (96 / 72).toFixed(2)
}

function emuToPixels(emu) {
  if (emu instanceof String || typeof emu === 'string') emu = parseFloat(emu)
  const pixels = (emu / 914400) * 96
  return pixels.toFixed(2);
}

export {
  inchesToTwips,
  twipsToInches,
  twipsToPixels,
  halfPointToPixels,
  emuToPixels
}