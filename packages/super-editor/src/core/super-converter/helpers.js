function inchesToTwips(inches) {
  if (!inches) return;
  if (inches instanceof String || typeof inches === 'string') inches = parseFloat(inches)
  return (inches * 1440).toFixed(2);
}

function twipsToInches(twips) {
  if (!twips) return;
  if (twips instanceof String || typeof inches === 'string') twips = int(twips)
  return (twips / 1440).toFixed(2);
}

function twipsToPixels(twips) {
  if (!twips) return;
  twips = twipsToInches(twips);
  return (twips * 96).toFixed(2);
}

function pixelsToTwips(pixels) {
  if (!pixels) return;
  pixels = pixels / 96;
  return inchesToTwips(pixels);
}

function halfPointToPixels(halfPoints) {
  if (!halfPoints) return;
  return (96 / 72).toFixed(2)
}

function emuToPixels(emu) {
  if (!emu) return;
  if (emu instanceof String || typeof emu === 'string') emu = parseFloat(emu)
  const pixels = (emu / 914400) * 96
  return pixels.toFixed(2);
}

function pixelsToHalfPoints(pixels) {
  if (!pixels) return;
  return (pixels * 72 / 96).toFixed(2);
}

export {
  inchesToTwips,
  twipsToInches,
  twipsToPixels,
  pixelsToTwips,
  halfPointToPixels,
  emuToPixels,
  pixelsToHalfPoints
}