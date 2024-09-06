function inchesToTwips(inches) {
  if (!inches) return;
  if (typeof inches === 'string') inches = parseFloat(inches);
  return Math.round(inches * 1440);
}

function twipsToInches(twips) {
  if (!twips) return;
  if (typeof twips === 'string') twips = parseInt(twips, 10);
  return Math.round((twips / 1440) * 100) / 100;
}

function twipsToPixels(twips) {
  if (!twips) return;
  twips = twipsToInches(twips);
  return Math.round(twips * 96);
}

function pixelsToTwips(pixels) {
  if (!pixels) return;
  pixels = pixels / 96;
  return inchesToTwips(pixels);
}

function halfPointToPixels(halfPoints) {
  if (!halfPoints) return;
  return Math.round(96 / 72);
}

function emuToPixels(emu) {
  if (!emu) return;
  if (typeof emu === 'string') emu = parseFloat(emu);
  const pixels = (emu / 914400) * 96;
  return Math.round(pixels);
}

function pixelsToHalfPoints(pixels) {
  if (!pixels) return;
  return Math.round(pixels * 72 / 96);
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