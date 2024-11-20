function inchesToTwips(inches) {
  if (inches == null) return;
  if (typeof inches === 'string') inches = parseFloat(inches);
  return Math.round(inches * 1440);
}

function twipsToInches(twips) {
  if (twips == null) return;
  if (typeof twips === 'string') twips = parseInt(twips, 10);
  return Math.round((twips / 1440) * 100) / 100;
}

function twipsToPixels(twips) {
  if (twips == null) return;
  twips = twipsToInches(twips);
  return Math.round(twips * 96);
}

function pixelsToTwips(pixels) {
  if (pixels == null) return;
  pixels = pixels / 96;
  return inchesToTwips(pixels);
}

function halfPointToPixels(halfPoints) {
  if (halfPoints == null) return;
  return Math.round(halfPoints * 96 / 72);
}

function halfPointToPoints(halfPoints) {
  if (halfPoints == null) return;
  return Math.round(halfPoints / 2);
}

function emuToPixels(emu) {
  if (emu == null) return;
  if (typeof emu === 'string') emu = parseFloat(emu);
  const pixels = (emu * 96) / 914400;
  return Math.round(pixels);
}

function pixelsToEmu(px) {
  if (px == null) return;
  if (typeof px === 'string') px = parseFloat(px);
  return Math.round(px * 9525);
}

function pixelsToHalfPoints(pixels) {
  if (pixels == null) return;
  return Math.round(pixels * 72 / 96);
}

function eigthPointsToPixels(eigthPoints) {
  if (eigthPoints == null) return;
  const points = parseFloat(eigthPoints) / 8;
  const pixels = points * 1.3333;
    return pixels;
}

function pixelsToEightPoints(pixels) {
  if (pixels == null) return;
  return Math.round(pixels * 6);
}

const getBlobFromUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return blob;
}

const getContentTypesFromXml = (contentTypesXml) => {
  const parser = new window.DOMParser();
  const xmlDoc = parser.parseFromString(contentTypesXml,'text/xml');
  const defaults = xmlDoc.querySelectorAll('Default');
  return Array.from(defaults).map(item => item.getAttribute('Extension'));
}

export {
  inchesToTwips,
  twipsToInches,
  twipsToPixels,
  pixelsToTwips,
  halfPointToPixels,
  emuToPixels,
  pixelsToEmu,
  pixelsToHalfPoints,
  halfPointToPoints,
  eigthPointsToPixels,
  pixelsToEightPoints,
  getBlobFromUrl,
  getContentTypesFromXml
}
